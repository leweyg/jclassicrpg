/*
 * Copyright (c) 2003-2009 jMonkeyEngine
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 * * Redistributions of source code must retain the above copyright
 *   notice, this list of conditions and the following disclaimer.
 *
 * * Redistributions in binary form must reproduce the above copyright
 *   notice, this list of conditions and the following disclaimer in the
 *   documentation and/or other materials provided with the distribution.
 *
 * * Neither the name of 'jMonkeyEngine' nor the names of its contributors 
 *   may be used to endorse or promote products derived from this software 
 *   without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED
 * TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 * LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

package org.jcrpg.threed.core.loader;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.URL;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.logging.Logger;

import org.jcrpg.threed.J3DCore;

import com.ardor3d.bounding.BoundingBox;
import com.ardor3d.image.Texture;
import com.ardor3d.math.ColorRGBA;
import com.ardor3d.math.Vector2;
import com.ardor3d.math.Vector3;
import com.ardor3d.renderer.state.BlendState;
import com.ardor3d.renderer.state.MaterialState;
import com.ardor3d.renderer.state.TextureState;
import com.ardor3d.scenegraph.FloatBufferDataUtil;
import com.ardor3d.scenegraph.Mesh;
import com.ardor3d.scenegraph.Node;
import com.ardor3d.scenegraph.Spatial;
import com.ardor3d.util.TextureManager;
import com.ardor3d.util.export.binary.BinaryExporter;
import com.ardor3d.util.geom.BufferUtils;
import com.ardor3d.util.geom.GeometryTool;
import com.ardor3d.util.resource.ResourceLocatorTool;
import com.ardor3d.util.resource.ResourceSource;

/**
 * Started Date: Jul 17, 2004<br>
 * <br>
 * Converts .obj files into .jme binary format. In order for ObjToJme to find
 * the .mtl library, you must specify the "mtllib" tag to the baseURL where the
 * mtl libraries are to be found: eg.
 * setProperty("mtllib",new File("c:/my material dir/").toURL());
 * 
 * Textures will be loaded from the directory indicated in the model unless you
 * specify a directory to load them from via setting a property: eg.
 * setProperty("texdir", new File("c:/my texdir/").toURL());
 * 
 *  * Modified by Skye Book (sbook), 7/16/09:
 * Added in argument in the constructor to name the node that gets
 * returned in the buildStructure method.  
 * 
 * * Conversion to Ardor3d
 * 
 * @author Pal Illes - converted to Ardor3D
 * @author Jack Lindamood
 * @author Joshua Slack - revamped to improve speed
 */
public class ObjToArdor3d extends FormatConverter {
    private static final Logger logger = Logger.getLogger(ObjToArdor3d.class
            .getName());
    
    private BufferedReader inFile;
    /** Every vertex in the file */
    private ArrayList<Vector3> vertexList = new ArrayList<Vector3>();
    /** Every texture coordinate in the file */
    private ArrayList<Vector2> textureList = new ArrayList<Vector2>();
    /** Every normal in the file */
    private ArrayList<Vector3> normalList = new ArrayList<Vector3>();
    /** Generated normals */
    private ArrayList<Vector3> genNormalList = new ArrayList<Vector3>();
    /** Last 'material' flag in the file */
    private MaterialGrouping curGroup;
    /** Last 'Object' name in the file */
    private String curObjectName = null;
    /** Last 'Group' name in the file */
    private String curGroupName = null;
    /** Default material group for groups without a material */
    private MaterialGrouping defaultMaterialGroup;
    /** Maps material names to the actual material object * */
    private HashMap<String, MaterialGrouping> materialNames = new HashMap<String, MaterialGrouping>();
    /** Maps Materials to their vertex usage * */
    private HashMap<MaterialGrouping, ArraySet> materialSets = new HashMap<MaterialGrouping, ArraySet>();
    /** Reference to the renderer for creating RenderState objects **/
    private boolean generateMissingNormals = true;
    
    /**
     * Converts an Obj file to jME format. The syntax is: "ObjToJme file.obj
     * outfile.jme".
     * 
     * @param args
     *            The array of parameters
     */
    public static void main(String[] args) {
    	//DisplaySystem.getDisplaySystem(DummySystemProvider.DUMMY_SYSTEM_IDENTIFIER);
        new ObjToArdor3d().attemptFileConvert(args);
    }
    
    /**
     * Converts an .obj file to .jme format. If you wish to use a .mtl to load
     * the obj's material information please specify the base url where the .mtl
     * is located with setProperty("mtllib",new URL(baseURL))
     * 
     * @param format
     *            The .obj file's stream.
     * @param jMEFormat
     *            The .jme file's stream.
     * @throws IOException
     *             If anything bad happens.
     */
    @Override
    public void convert(InputStream format, OutputStream jMEFormat)
            throws IOException {
        defaultMaterialGroup = new MaterialGrouping();
        vertexList.clear();
        textureList.clear();
        normalList.clear();
        genNormalList.clear();
        materialSets.clear();
        materialNames.clear();
        inFile = new BufferedReader(new InputStreamReader(format));
        String in;
        curGroup = defaultMaterialGroup;
        materialSets.put(defaultMaterialGroup, new ArraySet());
        while ((in = inFile.readLine()) != null) {
            processLine(in);
        }
        BinaryExporter.getInstance().save(buildStructure(null),jMEFormat);
        nullAll();
    }
    
    /**
     * Converts an .obj file to .jme format. If you wish to use a .mtl to load
     * the obj's material information please specify the base url where the .mtl
     * is located with setProperty("mtllib",new URL(baseURL))
     * 
     * @param format
     *             The .obj file's stream.
     * @param jMEFormat
     *             The .jme file's stream.
     * @param returnedNodeName
     * 			   Allows the Node returned from the buildStructure method to
     * 			   be named.
     * @throws IOException
     *             If anything bad happens.
     */
    public void convert(InputStream format, OutputStream jMEFormat, String returnedNodeName)
            throws IOException {
        defaultMaterialGroup = new MaterialGrouping();
        vertexList.clear();
        textureList.clear();
        normalList.clear();
        genNormalList.clear();
        materialSets.clear();
        materialNames.clear();
        inFile = new BufferedReader(new InputStreamReader(format));
        String in;
        curGroup = defaultMaterialGroup;
        materialSets.put(defaultMaterialGroup, new ArraySet());
        while ((in = inFile.readLine()) != null) {
            processLine(in);
        }
        BinaryExporter.getInstance().save(buildStructure(returnedNodeName),jMEFormat);
        nullAll();
    }

    /**
     * Nulls all to let the gc do its job.
     * 
     * @throws IOException
     */
    private void nullAll() throws IOException {
        vertexList.clear();
        textureList.clear();
        normalList.clear();
        genNormalList.clear();
        curGroup = null;
        materialSets.clear();
        materialNames.clear();
        inFile.close();
        inFile = null;
        defaultMaterialGroup = null;
    }

    /**
     * Converts the structures of the .obj file to a scene to write
     * 
     * @return The TriMesh or Node that represents the .obj file.
     */
    private Spatial buildStructure(String returnedNodeName) {
    	Node toReturn;
    	if (returnedNodeName == null || returnedNodeName == "")
    	{
    		toReturn = new Node("obj file");
    	}
    	else
    	{
    		toReturn = new Node(returnedNodeName);
    	}
        Object[] o = materialSets.keySet().toArray();
        for (int i = 0; i < o.length; i++) {
            MaterialGrouping thisGroup = (MaterialGrouping) o[i];
            ArraySet thisSet = materialSets.get(thisGroup);
            if (thisSet.indexes.size() < 3)
                continue;
            Mesh thisMesh = new Mesh(thisSet.objName == null ? "temp" + i : thisSet.objName);
            Vector3[] vert = new Vector3[thisSet.sets.size()];
            Vector3[] norm = new Vector3[vert.length];
            Vector2[] text = new Vector2[vert.length];
            boolean hasNorm = false, hasTex = false;

            int j = 0;
            for (IndexSet set : thisSet.sets) {
                vert[j] = vertexList.get(set.vIndex);
                if (set.nIndex >= 0) {
                    norm[j] = normalList.get(set.nIndex);
                    hasNorm = true;
                } else if (set.nIndex < -1) {
                    norm[j] = genNormalList.get((-1*set.nIndex)-2);
                    hasNorm = true;
                }
                if (set.tIndex >= 0) {
                    text[j] = textureList.get(set.tIndex);
                    hasTex = true;
                }
                j++;
            }
            
            int[] indexes = new int[thisSet.indexes.size()];
            for (j = 0; j < thisSet.indexes.size(); j++)
                indexes[j] = thisSet.indexes.get(j);
            
            thisMesh.getMeshData().setVertexBuffer(BufferUtils.createFloatBuffer(vert));
            thisMesh.getMeshData().setIndexBuffer(BufferUtils.createIntBuffer(indexes));
            thisMesh.getMeshData().setNormalBuffer(hasNorm ? BufferUtils.createFloatBuffer(norm) : null);
            if (hasTex)
            	thisMesh.getMeshData().setTextureBuffer(hasTex ? FloatBufferDataUtil.makeNew(text).getBuffer() : null, 0);

            if (properties.get("sillycolors") != null)
                thisMesh.setRandomColors();
            if (thisGroup.ts != null)
                thisMesh.setRenderState(thisGroup.ts);
            thisMesh.setRenderState(thisGroup.m);
            if (thisGroup.as != null) {
                thisMesh.setRenderState(thisGroup.as);
                //thisMesh.getSceneHints().setRenderBucketType(RenderBucketType.Transparent);
            }
            thisMesh.setModelBound(new BoundingBox());
            thisMesh.updateModelBound();
            GeometryTool.minimizeVerts(thisMesh, EnumSet.of(GeometryTool.MatchCondition.Color , GeometryTool.MatchCondition.Normal , GeometryTool.MatchCondition.UVs));
            toReturn.attachChild(thisMesh);
        }
        if (toReturn.getChildren()!=null && toReturn.getChildren().size() == 1)
            return toReturn.getChild(0);
        
        return toReturn;
    }

    /**
     * Processes a line of text in the .obj file.
     * 
     * @param s
     *            The line of text in the file.
     * @throws IOException
     */
    private void processLine(String s) throws IOException {
        if (s == null)
            return;
        if (s.length() == 0)
            return;
        String[] parts = s.split("\\s+");
        parts = removeEmpty(parts);
        if (parts.length == 0) return;
        if (parts[0].charAt(0) == '#')
            return;
        if ("v".equals(parts[0])) {
            addVertextoList(parts);
            return;
        } else if ("vt".equals(parts[0])) {
            addTextoList(parts);
            return;
        } else if ("vn".equals(parts[0])) {
            addNormalToList(parts);
            return;
        } else if ("g".equals(parts[0])) {
            // see what the material name is if there isn't a name, assume its
            // the default group
            if (parts.length >= 2 && materialNames.get(parts[1]) != null) {
                curGroupName = parts[1];
                curGroup = materialNames.get(parts[1]);
            }
            else
                setDefaultGroup();
            return;
        } else if ("f".equals(parts[0])) {
            addFaces(parts);
            return;
        } else if ("mtllib".equals(parts[0])) {
            loadMaterials(parts);
            return;
        } else if ("newmtl".equals(parts[0])) {
            addMaterial(parts);
            return;
        } else if ("usemtl".equals(parts[0])) {
            if (materialNames.get(parts[1]) != null)
                curGroup = materialNames.get(parts[1]);
            else
                setDefaultGroup();
            return;
        } else if ("Ka".equals(parts[0])) {
            curGroup.m.setAmbient(new ColorRGBA(Float.parseFloat(parts[1]),
                    Float.parseFloat(parts[2]), Float.parseFloat(parts[3]), curGroup.m.getAmbient().getAlpha()));
            return;
        } else if ("Kd".equals(parts[0])) {
            curGroup.m.setDiffuse(new ColorRGBA(Float.parseFloat(parts[1]),
                    Float.parseFloat(parts[2]), Float.parseFloat(parts[3]), curGroup.m.getDiffuse().getAlpha()));
            return;
        } else if ("Ks".equals(parts[0])) {
            curGroup.m.setSpecular(new ColorRGBA(Float.parseFloat(parts[1]),
                    Float.parseFloat(parts[2]), Float.parseFloat(parts[3]), curGroup.m.getSpecular().getAlpha()));
            return;
        } else if ("Ns".equals(parts[0])) {
            float shine = Float.parseFloat(parts[1]);
            if (shine > 128) {
                shine = 128;
            } else if (shine < 0) {
                shine = 0;
            }
            curGroup.m.setShininess(shine);
            return;
        } else if ("d".equals(parts[0])) {
            float alpha = Float.parseFloat(parts[1]);

            ColorRGBA amb = new ColorRGBA(curGroup.m.getAmbient());
            amb.setAlpha(amb.getAlpha()*alpha);
            curGroup.m.setAmbient(amb);

            ColorRGBA dif = new ColorRGBA(curGroup.m.getDiffuse());
            dif.setAlpha(dif.getAlpha()*alpha);
            curGroup.m.setDiffuse(dif);
            
            ColorRGBA spec = new ColorRGBA(curGroup.m.getSpecular());
            spec.setAlpha(spec.getAlpha()*alpha);
            curGroup.m.setSpecular(spec);
            
            if (alpha < 1.0f)
                curGroup.createBlendState();
            return;
        } else if ("map_d".equals(parts[0])) {
            curGroup.createBlendState();
            return;
        } else if ("map_Kd".equals(parts[0]) || "map_Ka".equals(parts[0])) {
            String name = s.trim().substring(7);
            ResourceSource source = null;
            source = ResourceLocatorTool.locateResource(ResourceLocatorTool.TYPE_TEXTURE, name);
            
            Texture t = TextureManager.load(source, Texture.MinificationFilter.BilinearNearestMipMap, true);
            
            t.setAnisotropicFilterPercent(0.0f);
            t.setMinificationFilter(Texture.MinificationFilter.BilinearNearestMipMap);
            t.setMagnificationFilter(Texture.MagnificationFilter.Bilinear);
            t.setWrap(Texture.WrapMode.Repeat);
            curGroup.ts = new TextureState();
            curGroup.ts.setTexture(t);
            curGroup.ts.setEnabled(true);
            return;
        } else if ("o".equals(parts[0])) {
            curObjectName = parts[1];
            logger.info("Object:" + curObjectName);

        }
    }

    private String[] removeEmpty(String[] parts) {
        int cnt = 0;
        for (int i = 0; i < parts.length; i++) {
            if (!parts[i].equals(""))
                cnt++;
        }
        String[] toReturn = new String[cnt];
        int index = 0;
        for (int i = 0; i < parts.length; i++) {
            if (!parts[i].equals("")) {
                toReturn[index++] = parts[i].trim();
            }
        }
        return toReturn;
    }

    private void addMaterial(String[] parts) {
        MaterialGrouping newMat = new MaterialGrouping();
        materialNames.put(parts[1], newMat);
        materialSets.put(newMat, new ArraySet());
        curGroup = newMat;
    }

    private void loadMaterials(String[] fileNames) throws IOException {
        URL matURL = (URL) properties.get("mtllib");
        if (matURL == null)
            return;
        for (int i = 1; i < fileNames.length; i++) {
            processMaterialFile(new URL(matURL, fileNames[i]).openStream());
        }
    }

    private void processMaterialFile(InputStream inputStream)
            throws IOException {
        BufferedReader matFile = new BufferedReader(new InputStreamReader(
                inputStream));
        String in;
        while ((in = matFile.readLine()) != null) {
            processLine(in);
        }
    }

    private void addFaces(String[] parts) {
        ArraySet thisMat = materialSets.get(curGroup);
        if (thisMat.objName == null) {
            if (curObjectName != null) {
                thisMat.objName = curObjectName;
            }
            else if (curGroupName != null) {
                thisMat.objName = curGroupName;
            }   
        }
        IndexSet first = new IndexSet(parts[1]);
        int firstIndex = thisMat.findSet(first);
        IndexSet second = new IndexSet(parts[2]);
        int secondIndex = thisMat.findSet(second);
        for (int i = 3; i < parts.length; i++) {
            IndexSet third = new IndexSet();
            third.parseStringArray(parts[i]);
            int thirdIndex = thisMat.findSet(third);
            thisMat.indexes.add(firstIndex);
            thisMat.indexes.add(secondIndex);
            thisMat.indexes.add(thirdIndex);
            if (first.nIndex == -1 || second.nIndex == -1 || third.nIndex == -1) {
                // Generate flat face normal.  TODO: Smoothed normals?
                Vector3 v = new Vector3(vertexList.get(second.vIndex));
                Vector3 w = new Vector3(vertexList.get(third.vIndex));
                v.subtractLocal(vertexList.get(first.vIndex));
                w.subtractLocal(vertexList.get(first.vIndex));
                v.crossLocal(w);
                v.normalizeLocal();
                genNormalList.add(v);
                int genIndex = (-1 * (genNormalList.size() - 1)) - 2;
                if (first.nIndex == -1) {
                    first.nIndex = genIndex;
                }
                if (second.nIndex == -1) {
                    second.nIndex = genIndex;
                }
                if (third.nIndex == -1) {
                    third.nIndex = genIndex;
                }
            }
            secondIndex = thirdIndex; // The second will be the same as the
                                        // last third
        }
    }

    private void setDefaultGroup() {
        curGroup = defaultMaterialGroup;
    }

    private void addNormalToList(String[] parts) {
        Vector3 norm = new Vector3(Float.parseFloat(parts[1]), Float
                .parseFloat(parts[2]), Float.parseFloat(parts[3]));
        normalList.add(norm);

    }

    private void addTextoList(String[] parts) {
        float u = Float.parseFloat(parts[1]);
        float v = 0;
        //float w = 0; (3d coordinate possible)
        
        if (parts.length > 2)
            v = Float.parseFloat(parts[2]);
        
        textureList.add(new Vector2(u,v));
    }

    private void addVertextoList(String[] parts) {
        vertexList.add(new Vector3(Float.parseFloat(parts[1]), Float
                .parseFloat(parts[2]), Float.parseFloat(parts[3])));
    }

    private class MaterialGrouping {
        public MaterialGrouping() {
            m = new MaterialState();
            m.setAmbient(new ColorRGBA(.2f, .2f, .2f, 1));
            m.setDiffuse(new ColorRGBA(.8f, .8f, .8f, 1));
            m.setSpecular(new ColorRGBA(ColorRGBA.WHITE));
            m.setEnabled(true);
        }

        public void createBlendState() {
            if (as != null)
                return;
            as = new BlendState();
            as.setBlendEnabled(true);
            as.setSourceFunction(BlendState.SourceFunction.SourceAlpha);
            as.setDestinationFunction(BlendState.DestinationFunction.OneMinusSourceAlpha);
            as.setTestEnabled(true);
            as.setTestFunction(BlendState.TestFunction.GreaterThan);
            as.setEnabled(true);
        }

        MaterialState m;
        TextureState ts;
        BlendState as;
    }

    /**
     * Stores the indexes of a vertex/texture/normal triplet set that is to be
     * indexed by the TriMesh.
     */
    private class IndexSet {
        int vIndex, nIndex, tIndex;
        int index;
        public IndexSet() {
        }

        public IndexSet(String parts) {
            parseStringArray(parts);
        }

        public void parseStringArray(String parts) {
            String[] triplet = parts.split("/");
            vIndex = Integer.parseInt(triplet[0]);
            if (vIndex < 0) {
                vIndex += vertexList.size();
            } else {
                vIndex--;  // obj starts at 1 not 0
            }
            
            if (triplet.length < 2 || triplet[1] == null
                    || triplet[1].equals("")) {
                tIndex = -1;
            } else {
                tIndex = Integer.parseInt(triplet[1]);
                if (tIndex < 0) {
                    tIndex += textureList.size();
                } else {
                    tIndex--;  // obj starts at 1 not 0
                }
            }
            
            if (triplet.length != 3 || triplet[2] == null
                    || triplet[2].equals("")) {
                nIndex = -1;
            } else {
                nIndex = Integer.parseInt(triplet[2]);
                if (nIndex < 0) {
                    nIndex += normalList.size();
                } else {
                    nIndex--;  // obj starts at 1 not 0
                }

            }
        }
        
        @Override
        public boolean equals(Object obj) {
            if (!(obj instanceof IndexSet)) return false;
            
            IndexSet other = (IndexSet)obj;
            if (other.nIndex != this.nIndex) return false;
            if (other.tIndex != this.tIndex) return false;
            if (other.vIndex != this.vIndex) return false;
            return true;
        }
        
        @Override
        public int hashCode() {
            int hash = 37;
            hash += 37 * hash + vIndex;
            hash += 37 * hash + nIndex;
            hash += 37 * hash + tIndex;
            return hash;
        }
    }

    /**
     * An array of information that will become a renderable trimesh. Each
     * material has it's own trimesh.
     */
    private class ArraySet {
        private String objName = null;
        private LinkedHashSet<IndexSet> sets = new LinkedHashSet<IndexSet>();
        private HashMap<IndexSet, Integer> index = new HashMap<IndexSet, Integer>();
        private ArrayList<Integer> indexes = new ArrayList<Integer>();

        public int findSet(IndexSet v) {
            if (sets.contains(v)) {
                return index.get(v);
            }

            sets.add(v);
            index.put(v, sets.size()-1);
            return sets.size()-1;
        }
    }

    /**
     * @return true if the loader will generate missing face normals (default is true)
     */
    public boolean isGenerateMissingNormals() {
        return generateMissingNormals;
    }

    /**
     * Set whether to generate missing face normals.
     * 
     * @param generateMissingNormals
     *            the generateMissingNormals to set
     */
    public void setGenerateMissingNormals(boolean generateMissingNormals) {
        this.generateMissingNormals = generateMissingNormals;
    }
}