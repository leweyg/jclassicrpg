/*
 *  This file is part of JavaCRPG.
 *
 *  JavaCRPG is free software; you can redistribute it and/or modify
 *  it under the terms of the GNU Lesser General Public License as published by
 *  the Free Software Foundation; either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  JavaCRPG is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Lesser General Public License for more details.
 *
 *  You should have received a copy of the GNU Lesser General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

package org.jcrpg.threed.engine.vegetation;

import java.nio.FloatBuffer;
import java.util.List;

import org.jcrpg.threed.J3DCore;
import org.jcrpg.threed.PooledSharedNode;
import org.jcrpg.util.HashUtil;
import org.lwjgl.util.vector.Vector3f;

import com.ardor3d.math.FastMath;
import com.ardor3d.math.Quaternion;
import com.ardor3d.math.Vector3;
import com.ardor3d.renderer.Camera;
import com.ardor3d.renderer.Renderer;
import com.ardor3d.scenegraph.Mesh;
import com.ardor3d.scenegraph.Node;
import com.ardor3d.scenegraph.Spatial;

/**
 * Fully billboarded quad vegetation.
 * 
 * @author pali
 * 
 */
public class QuadBillboardVegetation extends AbstractVegetation {

	/**
	 * 
	 */
	private static final long serialVersionUID = -3942670677329376647L;

	private Vector3 tmpVec = new Vector3();

	public QuadBillboardVegetation(String string, J3DCore core, Camera cam, float viewDistance) {
		super(string, core, cam, viewDistance);
	}

	public void addVegetationObject1(Spatial target, Vector3 translation, Vector3 scale, Quaternion rotation) {
		if ((target instanceof Node)) {
			
			Node node = PooledSharedNode.copyNode("SharedNode", (Node) target);
			node.setTranslation(translation);
			node.setScale(scale);
			node.setRotation(rotation);
			this.attachChild(node);
		} else if ((target instanceof Mesh)) {
			Mesh node = PooledSharedNode.copyMesh("SharedMesh", (Mesh) target);
			node.setTranslation(translation);
			node.setScale(scale);
			node.setRotation(rotation);

			this.attachChild(node);
		}
	}

	boolean windSwitch = true;

	Vector3 origTranslation = null;

	long passedTime = 0;

	float timeCounter = 0;

	long startTime = System.currentTimeMillis();

	public float windPower = 0.5f;

	public static final float TIME_DIVIDER = 400;

	double diffs[] = new double[5];

	double newDiffs[] = new double[5];

	public void draw(Renderer r) {
		if (origTranslation == null)
			origTranslation = new Vector3(this.getTranslation());
		long additionalTime = Math.min(System.currentTimeMillis() - startTime,15);
		passedTime += additionalTime;
		startTime= System.currentTimeMillis();

		boolean doGrassMove = false;
		if (J3DCore.SETTINGS.ANIMATED_GRASS) {
			doGrassMove = true;
		}

		if (getChildren() == null) {
			return;
		}

		double diff = 0;

		if (doGrassMove) {
			// creating 5 diffs to look random
			diff = 0.059f * FastMath.sin(((passedTime / TIME_DIVIDER) * windPower)) * windPower;
			newDiffs[0] = diff;
			diff = 0.059f * FastMath.sin((((passedTime + 500) / TIME_DIVIDER) * windPower * (0.5f)))
					* windPower;
			newDiffs[1] = diff;
			diff = 0.059f * FastMath.sin((((passedTime + 500) / TIME_DIVIDER) * windPower * (0.6f)))
					* windPower;
			newDiffs[2] = diff;
			diff = 0.059f * FastMath.sin((((passedTime + 1000) / TIME_DIVIDER) * windPower * (0.8f)))
					* windPower;
			newDiffs[3] = diff;
			diff = 0.059f * FastMath.sin((((passedTime + 2000) / TIME_DIVIDER) * windPower * (0.7f)))
					* windPower;
			newDiffs[4] = diff;
		}
		diffs = newDiffs;

		// billboard world rotation calc
		Vector3 look = cam.getDirection().negate(null);
		Vector3 left1 = cam.getLeft().negate(null);
		Quaternion orient = new Quaternion();
		orient.fromAxes(left1, cam.getUp(), look);

		Spatial child;
		for (int i = 0, cSize = getChildren().size(); i < cSize; i++) {
			int whichDiff = 0;
			if (J3DCore.SETTINGS.ANIMATED_GRASS)
				whichDiff = i % 5;

			child = getChildren().get(i);

			if (child != null) {
				double distSquared = tmpVec.set(cam.getLocation()).subtractLocal(child.getWorldTranslation())
						.lengthSquared();
				if (distSquared <= viewDistance * viewDistance)
					if (distSquared < 3 * 3
							|| HashUtil.mixPercentage(i, 0, 0) + 10 > (distSquared / (viewDistance * viewDistance)) * 100) {
						// original code
						// ?? ardor3d TODO r.setCamera(cam);
						child.updateGeometricState(0.0f, false);
						child.onDraw(r);

						// animation

						if (child instanceof Node) {
							Node n = (Node) child;
							List<Spatial> c2 = n.getChildren();
							for (Spatial s : c2) {
								// if (s instanceof TriMesh)
								{
									Mesh q = (Mesh) s;
									q.setWorldRotation(orient); // BILLBOARDING

									if (!(doGrassMove))
										continue;
									// CPU computed grass moving
									Mesh b = q;
									FloatBuffer fb = b.getMeshData().getVertexBuffer();
									for (int fIndex = 0; fIndex < 4 * 3; fIndex++) {
										boolean f2_1Read = false;
										boolean f2_2Read = false;
										float f2_1 = 0;
										float f2_2 = 0;
										if (fIndex<3 || fIndex>=9 && fIndex<12) {
											int mul = 1;
											if (Math.floor(fIndex / 3) == 3)
												mul = -1;
											if (fIndex % 3 == 0) {
												// float f = fb.get(fIndex);
												if (!f2_1Read) {
													f2_1 = fb.get(fIndex + 3 * mul);
													f2_1Read = true;
												}
												fb.put(fIndex, (float)(f2_1 + diffs[whichDiff]));
											}
											if (fIndex % 3 == 2) {
												// float f = fb.get(fIndex);
												if (!f2_2Read) {
													f2_2 = fb.get(fIndex + 3 * mul);
													f2_2Read = true;
												}
												fb.put(fIndex, (float)(f2_2 + diffs[whichDiff]));
											}
										}
									}

								}
							}
						}

					}
			}
		}
	}

	public float getWindPower() {
		return windPower;
	}

	public void setWindPower(float windPower) {
		this.windPower = windPower;
	}

	@Override
	public void addVegetationObject(Spatial target, Vector3 translation,
			Vector3 scale, Quaternion rotation) {
		// TODO Auto-generated method stub
		
	}
}