/*
 * obj_mtl_loader.js
 *
 * Minimal, dependency-free Wavefront OBJ + MTL loader for the real assets
 * shipped under media/models/**. three.js's official OBJLoader/MTLLoader
 * addons are not vendored in this repo (only three.core.js/three.module.js
 * are), so this is a small purpose-built parser instead of a full OBJLoader
 * port. It only supports what the engine's exported models actually use:
 * polygonal faces (triangles/quads/n-gons, fan-triangulated) referencing
 * v/vt/vn, and MTL Kd/map_Kd/d.
 *
 * Blender (the tool these .obj files were exported from) is Z-up; three.js
 * is Y-up. Every position/normal is converted with (x, y, z) -> (x, z, -y),
 * a handedness-preserving -90deg rotation about X.
 */

import * as THREE from "./threejs/three.module.js";

const objTextCache = new Map();
const mtlCache = new Map();
const textureCache = new Map();
const textureLoader = new THREE.TextureLoader();

// Real per-quality texture directories to probe for a given map_Kd basename (first hit wins).
const TEXTURE_DIR_CANDIDATES = [
	"media/textures/models/low_png",
	"media/textures/models/common",
];

function toThreeAxis(x, y, z) {
	return [x, z, -y];
}

async function fetchText(url) {
	if (objTextCache.has(url)) return objTextCache.get(url);
	const res = await fetch(url);
	if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
	const text = await res.text();
	objTextCache.set(url, text);
	return text;
}

function parseMtl(text) {
	const materials = {};
	let current = null;
	for (const rawLine of text.split(/\r?\n/)) {
		const line = rawLine.trim();
		if (!line || line.startsWith("#")) continue;
		const [key, ...rest] = line.split(/\s+/);
		const val = rest.join(" ");
		if (key === "newmtl") {
			current = { name: val, Kd: [0.7, 0.7, 0.7], d: 1, map_Kd: null };
			materials[val] = current;
		} else if (!current) {
			continue;
		} else if (key === "Kd") {
			const [r, g, b] = rest.map(Number);
			current.Kd = [r, g, b];
		} else if (key === "d") {
			current.d = Number(val);
		} else if (key === "map_Kd") {
			current.map_Kd = rest[rest.length - 1];
		}
	}
	return materials;
}

async function loadMtl(mtlUrl) {
	if (mtlCache.has(mtlUrl)) return mtlCache.get(mtlUrl);
	const promise = fetchText(mtlUrl).then(parseMtl).catch(() => ({}));
	mtlCache.set(mtlUrl, promise);
	return promise;
}

function baseName(filename) {
	return filename.replace(/\\/g, "/").split("/").pop().replace(/\.[^.]+$/, "");
}

/** Tries each known texture tier directory for a PNG match; resolves to a THREE.Texture or null. */
async function resolveTexture(mapKdFilename) {
	if (!mapKdFilename) return null;
	const base = baseName(mapKdFilename);
	if (textureCache.has(base)) return textureCache.get(base);

	const promise = (async () => {
		for (const dir of TEXTURE_DIR_CANDIDATES) {
			const url = `${dir}/${base}.png`;
			try {
				const head = await fetch(url, { method: "HEAD" });
				if (!head.ok) continue;
				return await new Promise((resolve) => {
					textureLoader.load(
						url,
						(tex) => {
							tex.colorSpace = THREE.SRGBColorSpace;
							tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
							resolve(tex);
						},
						undefined,
						() => resolve(null)
					);
				});
			} catch {
				// try next candidate directory
			}
		}
		return null;
	})();

	textureCache.set(base, promise);
	return promise;
}

/** Parses face vertex refs like "12/4/3", "12//3", "12/4", "12" into {v, vt, vn} (1-indexed, may be null). */
function parseFaceVertex(token) {
	const parts = token.split("/");
	return {
		v: parts[0] ? parseInt(parts[0], 10) : null,
		vt: parts[1] ? parseInt(parts[1], 10) : null,
		vn: parts[2] ? parseInt(parts[2], 10) : null,
	};
}

function resolveIndex(idx, count) {
	if (idx == null) return null;
	return idx > 0 ? idx - 1 : count + idx;
}

/**
 * Parses OBJ text into per-material non-indexed vertex buffers
 * (positions/normals/uvs), fan-triangulating n-gon faces.
 */
function parseObj(text) {
	const positions = [];
	const normals = [];
	const uvs = [];
	const groupsByMaterial = new Map();
	let currentMaterial = "__default__";
	let mtllib = null;

	const ensureGroup = (name) => {
		if (!groupsByMaterial.has(name)) {
			groupsByMaterial.set(name, { positions: [], normals: [], uvs: [] });
		}
		return groupsByMaterial.get(name);
	};

	const emitVertex = (group, fv) => {
		const vi = resolveIndex(fv.v, positions.length);
		const ni = resolveIndex(fv.vn, normals.length);
		const ti = resolveIndex(fv.vt, uvs.length);
		const p = positions[vi] ?? [0, 0, 0];
		group.positions.push(p[0], p[1], p[2]);
		if (ni != null && normals[ni]) {
			const n = normals[ni];
			group.normals.push(n[0], n[1], n[2]);
		} else {
			group.normals.push(0, 1, 0);
		}
		if (ti != null && uvs[ti]) {
			const t = uvs[ti];
			group.uvs.push(t[0], t[1]);
		} else {
			group.uvs.push(0, 0);
		}
	};

	for (const rawLine of text.split(/\r?\n/)) {
		const line = rawLine.trim();
		if (!line || line.startsWith("#")) continue;
		const sp = line.indexOf(" ");
		if (sp === -1) continue;
		const key = line.slice(0, sp);
		const rest = line.slice(sp + 1).trim();

		if (key === "mtllib") {
			mtllib = rest.trim();
		} else if (key === "usemtl") {
			currentMaterial = rest.trim();
		} else if (key === "v") {
			const [x, y, z] = rest.split(/\s+/).map(Number);
			positions.push(toThreeAxis(x, y, z));
		} else if (key === "vn") {
			const [x, y, z] = rest.split(/\s+/).map(Number);
			normals.push(toThreeAxis(x, y, z));
		} else if (key === "vt") {
			const [u, v] = rest.split(/\s+/).map(Number);
			uvs.push([u, v]);
		} else if (key === "f") {
			const tokens = rest.split(/\s+/).map(parseFaceVertex);
			const group = ensureGroup(currentMaterial);
			// Fan-triangulate n-gons (n>=3).
			for (let i = 1; i + 1 < tokens.length; i++) {
				emitVertex(group, tokens[0]);
				emitVertex(group, tokens[i]);
				emitVertex(group, tokens[i + 1]);
			}
		}
	}

	return { groupsByMaterial, mtllib };
}

/**
 * Loads an OBJ (+ its MTL, if any) into a THREE.Group with one Mesh per
 * material group. dirUrl is the folder the .obj/.mtl live in.
 */
export async function loadObjModel(dirUrl, objFilename) {
	const objUrl = `${dirUrl}/${objFilename}`;
	const text = await fetchText(objUrl);
	const { groupsByMaterial, mtllib } = parseObj(text);
	const materials = mtllib ? await loadMtl(`${dirUrl}/${mtllib}`) : {};

	const group = new THREE.Group();
	group.name = objFilename;

	for (const [matName, buf] of groupsByMaterial.entries()) {
		if (buf.positions.length === 0) continue;
		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute("position", new THREE.Float32BufferAttribute(buf.positions, 3));
		geometry.setAttribute("normal", new THREE.Float32BufferAttribute(buf.normals, 3));
		geometry.setAttribute("uv", new THREE.Float32BufferAttribute(buf.uvs, 2));

		const matDesc = materials[matName];
		const color = matDesc ? new THREE.Color(matDesc.Kd[0], matDesc.Kd[1], matDesc.Kd[2]) : new THREE.Color(0.6, 0.6, 0.6);
		const material = new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide });
		if (matDesc?.d != null && matDesc.d < 1) {
			material.transparent = true;
			material.opacity = matDesc.d;
			material.alphaTest = 0.3;
		}

		const mesh = new THREE.Mesh(geometry, material);
		group.add(mesh);

		if (matDesc?.map_Kd) {
			const tex = await resolveTexture(matDesc.map_Kd);
			if (tex) {
				material.map = tex;
				material.needsUpdate = true;
			}
		}
	}

	return group;
}
