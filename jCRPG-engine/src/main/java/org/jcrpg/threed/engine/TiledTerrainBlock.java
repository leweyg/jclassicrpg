/*
 *  This file is part of JavaCRPG.
 *  Copyright (C) 2008 Illes Pal Zoltan
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
package org.jcrpg.threed.engine;

/*
* Copyright (c) 2003-2006 jMonkeyEngine
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


import java.io.IOException;
import java.nio.FloatBuffer;
import java.nio.IntBuffer;

import org.jcrpg.threed.NodePlaceholder;
import org.jcrpg.threed.PooledNode;
import org.jcrpg.threed.ModelPool.PoolItemContainer;
import org.jcrpg.threed.engine.geometryinstancing.ExactBufferPool;

import com.ardor3d.math.ColorRGBA;
import com.ardor3d.math.Vector2;
import com.ardor3d.math.Vector3;
import com.ardor3d.scenegraph.FloatBufferData;
import com.ardor3d.scenegraph.Mesh;
import com.ardor3d.util.export.Ardor3dExporter;
import com.ardor3d.util.export.Ardor3dImporter;
import com.ardor3d.util.geom.BufferUtils;

/**
 * TiledTerrainBlock addition by Paul Illes (c) 2008.
 * It adds a plus one size bigger heightmap info that's bigger then the Tile's heightmap
 * by one size, so normals can be obtained from the bigger heighmap's vertex data generated
 * in constructor by buildHelperVertices.
 * 
 * <code>TerrainBlock</code> defines the lowest level of the terrain system.
 * <code>TerrainBlock</code> is the actual part of the terrain system that
 * renders to the screen. The terrain is built from a heightmap defined by a one
 * dimenensional int array. The step scale is used to define the amount of units
 * each block line will extend. Clod can be used to allow for level of detail
 * control. By directly creating a <code>TerrainBlock</code> yourself, you can
 * generate a brute force terrain. This is many times sufficient for small
 * terrains on modern hardware. If terrain is to be large, it is recommended
 * that you make use of the <code>TerrainPage</code> class.
 * 
 * @author Mark Powell
 * @version $Id: TerrainBlock.java,v 1.30 2006/11/19 16:09:53 renanse Exp $
 */
public class TiledTerrainBlock extends Mesh implements PooledNode {

    private static final long serialVersionUID = 1L;

    // size of the block, totalSize is the total size of the heightmap if this
    // block is just a small section of it.
    private int size;

    private int totalSize;

    private short quadrant = 1;

    // x/z step
    private Vector3 stepScale;

    // use lod or not
    private boolean useClod;

    // center of the block in relation to (0,0,0)
    private Vector2 offset;

    // amount the block has been shifted.
    private float offsetAmount;

    // heightmap values used to create this block
    private float[] heightMap;

    private float[] oldHeightMap;

    private static Vector3 calcVec1 = new Vector3();

    private static Vector3 calcVec2 = new Vector3();

    private static Vector3 calcVec3 = new Vector3();

    /**
     * Empty Constructor to be used internally only.
     */
    public TiledTerrainBlock() {
    }

    /**
     * For internal use only. Creates a new Terrainblock with the given name by
     * simply calling super(name)
     * 
     * @param name
     *            The name.
     * @see com.jme.scene.lod.AreaClodMesh#AreaClodMesh(java.lang.String)
     */
    public TiledTerrainBlock(String name) {
        super(name);
    }

    /**
     * Constructor instantiates a new <code>TerrainBlock</code> object. The
     * parameters and heightmap data are then processed to generate a
     * <code>Mesh</code> object for renderering.
     * 
     * @param name
     *            the name of the terrain block.
     * @param size
     *            the size of the heightmap.
     * @param stepScale
     *            the scale for the axes.
     * @param heightMap
     *            the height data.
     * @param heightMapBig
     *            the height data with the next Tile's heights too for tricky normal generation.
     * @param origin
     *            the origin offset of the block.
     * @param clod
     *            true will use level of detail, false will not.
     */
    public TiledTerrainBlock(String name, int size, Vector3 stepScale,
    		float[] heightMap, float[] heightMapBig, Vector3 origin, boolean clod) {
        this(name, size, stepScale, heightMap, heightMapBig, origin, clod, size,
                new Vector2(), 0);
    }

    
    /**
     * Constructor instantiates a new <code>TerrainBlock</code> object. The
     * parameters and heightmap data are then processed to generate a
     * <code>Mesh</code> object for renderering.
     * 
     * @param name
     *            the name of the terrain block.
     * @param size
     *            the size of the block.
     * @param stepScale
     *            the scale for the axes.
     * @param heightMap
     *            the height data.
     * @param origin
     *            the origin offset of the block.
     * @param clod
     *            true will use level of detail, false will not.
     * @param totalSize
     *            the total size of the terrain. (Higher if the block is part of
     *            a <code>TerrainPage</code> tree.
     * @param offset
     *            the offset for texture coordinates.
     * @param offsetAmount
     *            the total offset amount. Used for texture coordinates.
     */
    public TiledTerrainBlock(String name, int size, Vector3 stepScale,
    		float[] heightMap, float[] heightMapBig, Vector3 origin, boolean clod, int totalSize,
            Vector2 offset, float offsetAmount) {
        super(name);
        this.useClod = clod;
        this.size = size;
        
        this.helperSize = size+1;
        this.helperHeightMap = heightMapBig;
        
        this.stepScale = stepScale;
        this.totalSize = totalSize;
        this.offsetAmount = offsetAmount;
        this.offset = offset;
        this.heightMap = heightMap;

        setTranslation(origin);

        buildVertices();
        buildHelperVertices();
        buildTextureCoordinates();
        buildNormals();
        buildColors();
        //VBOInfo vbo = new VBOInfo(true);
        //batch.setVBOInfo(vbo);

    }
    
    Mesh helperBatch = new Mesh();
    float[] helperHeightMap = null;
    int helperSize = 0;
    
    


    
    /**
     * <code>setDetailTexture</code> copies the texture coordinates from the
     * first texture channel to another channel specified by unit, mulitplying
     * by the factor specified by repeat so that the texture in that channel
     * will be repeated that many times across the block.
     * 
     * @param unit
     *            channel to copy coords to
     * @param repeat
     *            number of times to repeat the texture across and down the
     *            block
     */
    public void setDetailTexture(int unit, float repeat) {
        getMeshData().copyTextureCoordinates(0, unit, repeat);
    }

    /**
     * <code>getHeight</code> returns the height of an arbitrary point on the
     * terrain. If the point is between height point values, the height is
     * linearly interpolated. This provides smooth height calculations. If the
     * point provided is not within the bounds of the height map, the NaN float
     * value is returned (Float.NaN).
     * 
     * @param position
     *            the vector representing the height location to check.
     * @return the height at the provided location.
     */
/*    public float getHeight(Vector2f position) {
        return getHeight(position.x, position.y);
    }
*/
    /**
     * <code>getHeight</code> returns the height of an arbitrary point on the
     * terrain. If the point is between height point values, the height is
     * linearly interpolated. This provides smooth height calculations. If the
     * point provided is not within the bounds of the height map, the NaN float
     * value is returned (Float.NaN).
     * 
     * @param position
     *            the vector representing the height location to check. Only the
     *            x and z values are used.
     * @return the height at the provided location.
     */
  /*  public float getHeight(Vector3 position) {
        return getHeight(position.getX(), position.getZ());
    }
*/
    /**
     * <code>getHeight</code> returns the height of an arbitrary point on the
     * terrain. If the point is between height point values, the height is
     * linearly interpolated. This provides smooth height calculations. If the
     * point provided is not within the bounds of the height map, the NaN float
     * value is returned (Float.NaN).
     * 
     * @param x
     *            the x coordinate to check.
     * @param z
     *            the z coordinate to check.
     * @return the height at the provided location.
     */
 /*   public float getHeight(double x, double z) {
        x /= stepScale.getXf();
        z /= stepScale.getZf();
        double col = Math.floor(x);
        double row = Math.floor(z);

        if (col < 0 || row < 0 || col >= size - 1 || row >= size - 1) {
            return Float.NaN;
        }
        double intOnX = x - col, intOnZ = z - row;

        double topLeft, topRight, bottomLeft, bottomRight;

        int focalSpot = (int) (col + row * size);

        // find the heightmap point closest to this position (but will always
        // be to the left ( < x) and above (< z) of the spot.
        topLeft = heightMap[focalSpot] * stepScale.getY();

        // now find the next point to the right of topLeft's position...
        topRight = heightMap[focalSpot + 1] * stepScale.getY();

        // now find the next point below topLeft's position...
        bottomLeft = heightMap[focalSpot + size] * stepScale.getY();

        // now find the next point below and to the right of topLeft's
        // position...
        bottomRight = heightMap[focalSpot + size + 1] * stepScale.getY();

        // Use linear interpolation to find the height.
        return FastMath.LERP(intOnZ, FastMath.LERP(intOnX, topLeft, topRight),
                FastMath.LERP(intOnX, bottomLeft, bottomRight));
    }
*/
    /**
     * <code>getHeightFromWorld</code> returns the height of an arbitrary
     * point on the terrain when given world coordinates. If the point is
     * between height point values, the height is linearly interpolated. This
     * provides smooth height calculations. If the point provided is not within
     * the bounds of the height map, the NaN float value is returned
     * (Float.NaN).
     * 
     * @param position
     *            the vector representing the height location to check.
     * @return the height at the provided location.
     */
 /*   public float getHeightFromWorld(Vector3 position) {
        Vector3 locationPos = calcVec1.set(position).subtractLocal(
                localTranslation);

        return getHeight(locationPos.x, locationPos.z);
    }
*/
    
    /**
     * <code>getSurfaceNormal</code> returns the normal of an arbitrary point
     * on the terrain. The normal is linearly interpreted from the normals of
     * the 4 nearest defined points. If the point provided is not within the
     * bounds of the height map, null is returned.
     * 
     * @param position
     *            the vector representing the location to find a normal at.
     * @param store
     *            the Vector3 object to store the result in. If null, a new one
     *            is created.
     * @return the normal vector at the provided location.
     */
  /*  public Vector3 getSurfaceNormal(Vector2f position, Vector3 store) {
        return getSurfaceNormal(position.x, position.y, store);
    }*/

    /**
     * <code>getSurfaceNormal</code> returns the normal of an arbitrary point
     * on the terrain. The normal is linearly interpreted from the normals of
     * the 4 nearest defined points. If the point provided is not within the
     * bounds of the height map, null is returned.
     * 
     * @param position
     *            the vector representing the location to find a normal at. Only
     *            the x and z values are used.
     * @param store
     *            the Vector3 object to store the result in. If null, a new one
     *            is created.
     * @return the normal vector at the provided location.
     */
   /* public Vector3 getSurfaceNormal(Vector3 position, Vector3 store) {
        return getSurfaceNormal(position.getXf(), position.getZf(), store);
    }*/

    /**
     * <code>getSurfaceNormal</code> returns the normal of an arbitrary point
     * on the terrain. The normal is linearly interpreted from the normals of
     * the 4 nearest defined points. If the point provided is not within the
     * bounds of the height map, null is returned.
     * 
     * @param x
     *            the x coordinate to check.
     * @param z
     *            the z coordinate to check.
     * @param store
     *            the Vector3 object to store the result in. If null, a new one
     *            is created.
     * @return the normal unit vector at the provided location.
     */
  /*  public Vector3 getSurfaceNormal(double x, double z, Vector3 store) {
        x /= stepScale.getX();
        z /= stepScale.getZ();
        double col = Math.floor(x);
        double row = Math.floor(z);

        if (col < 0 || row < 0 || col >= size - 1 || row >= size - 1) {
            return null;
        }
        double intOnX = x - col, intOnZ = z - row;

        if (store == null)
            store = new Vector3();

        Vector3 topLeft = store, topRight = calcVec1, bottomLeft = calcVec2, bottomRight = calcVec3;

        int focalSpot = (int) (col + row * size);
        Mesh batch = this;

        // find the heightmap point closest to this position (but will always
        // be to the left ( < x) and above (< z) of the spot.
        BufferUtils.populateFromBuffer(topLeft, batch.getMeshData().getNormalBuffer(),
                focalSpot);

        // now find the next point to the right of topLeft's position...
        BufferUtils.populateFromBuffer(topRight, batch.getMeshData().getNormalBuffer(),
                focalSpot + 1);

        // now find the next point below topLeft's position...
        BufferUtils.populateFromBuffer(bottomLeft, batch.getMeshData().getNormalBuffer(),
                focalSpot + size);

        // now find the next point below and to the right of topLeft's
        // position...
        BufferUtils.populateFromBuffer(bottomRight, batch.getMeshData().getNormalBuffer(),
                focalSpot + size + 1);

        // Use linear interpolation to find the height.
        topLeft.interpolate(topRight, intOnX);
        bottomLeft.interpolate(bottomRight, intOnX);
        topLeft.interpolate(bottomLeft, intOnZ);
        return topLeft.normalizeLocal();
    }
    */
    
    public static IntBuffer COMMON_INDEX_BUFFER = null;
    public static int COMMON_SIZE = 2;

    /**
     * <code>buildVertices</code> sets up the vertex and index arrays of the
     * Mesh.
     */
    private void buildVertices() {
    	Mesh batch = this;
    	
    	int vertexCount = heightMap.length;
    	
        //batch.getMeshData().setVertexCount(heightMap.length);
        if (batch.getMeshData().getVertexBuffer()==null || !(batch.getMeshData().getVertexBuffer().limit()==vertexCount*3))
        {
        	if (batch.getMeshData().getVertexBuffer()!=null)
        	{
        		ExactBufferPool.releaseVector3Buffer(batch.getMeshData().getVertexBuffer());
        	}
        	batch.getMeshData().setVertexBuffer(ExactBufferPool.getVector3Buffer(vertexCount));
        }
        helperBatch.getMeshData().updateVertexCount();
        
        //batch.setVertexBuffer(BufferUtils.createVector3Buffer(batch
          //      .getVertexBuffer(), batch.getVertexCount()));
        Vector3 point = new Vector3();
        for (int x = 0; x < size; x++) {
            for (int y = 0; y < size; y++) {
                point.set(x * stepScale.getX(), heightMap[x + (y * size)]
                        * stepScale.getY(), y * stepScale.getZ());
                BufferUtils.setInBuffer(point, batch.getMeshData().getVertexBuffer(),
                        (x + (y * size)));
            }
        }

        // set up the indices
        
        int triangleQuantity = ((size - 1) * (size - 1)) * 2;
        
        //(
        //batch.setTriangleQuantity((size - 1) * (size - 1)) * 2);

        // for common size, use the common index buffer
        if (size==COMMON_SIZE)
        {
	        if (COMMON_INDEX_BUFFER==null)
	        {
	        	COMMON_INDEX_BUFFER = ExactBufferPool.getIntBuffer(triangleQuantity
	                     * 3); 
	
	            // go through entire array up to the second to last column.
	            for (int i = 0; i < (size * (size - 1)); i++) {
	                // we want to skip the top row.
	                if (i % ((size * (i / size + 1)) - 1) == 0 && i != 0) {
	                    continue;
	                }
	                // set the top left corner.
	                COMMON_INDEX_BUFFER.put(i);
	                // set the bottom right corner.
	                COMMON_INDEX_BUFFER.put((1 + size) + i);
	                // set the top right corner.
	                COMMON_INDEX_BUFFER.put(1 + i);
	                // set the top left corner
	                COMMON_INDEX_BUFFER.put(i);
	                // set the bottom left corner
	                COMMON_INDEX_BUFFER.put(size + i);
	                // set the bottom right corner
	                COMMON_INDEX_BUFFER.put((1 + size) + i);
	            }
	        }
	        batch.getMeshData().setIndexBuffer(COMMON_INDEX_BUFFER);
        } else
        {
//        	batch.getMeshData().setIndexBuffer(ExactBufferPool.getIntBuffer(batch
  //                  .getMeshData().getTotalPrimitiveCount() * 3)); 
        	batch.getMeshData().setIndexBuffer(ExactBufferPool.getIntBuffer(triangleQuantity * 3));  // TODO is this valid ardor3d?

            // go through entire array up to the second to last column.
            for (int i = 0; i < (size * (size - 1)); i++) {
                // we want to skip the top row.
                if (i % ((size * (i / size + 1)) - 1) == 0 && i != 0) {
                    continue;
                }
                // set the top left corner.
                batch.getMeshData().getIndices().put(i);
                // set the bottom right corner.
                batch.getMeshData().getIndices().put((1 + size) + i);
                // set the top right corner.
                batch.getMeshData().getIndices().put(1 + i);
                // set the top left corner
                batch.getMeshData().getIndices().put(i);
                // set the bottom left corner
                batch.getMeshData().getIndices().put(size + i);
                // set the bottom right corner
                batch.getMeshData().getIndices().put((1 + size) + i);
            }
        }
        
    }
    
    public void releaseExtraBuffers()
    {
    	ExactBufferPool.releaseVector3Buffer(helperBatch.getMeshData().getVertexBuffer());
    	helperBatch.getMeshData().setVertexBuffer(null);
    }

    private void buildHelperVertices() {
    	int size = helperSize;
    	float[] heightMap = helperHeightMap;
        Mesh batch = helperBatch;
        int vertexCount = heightMap.length;
       // batch.setVertexCount(heightMap.length);
        if (batch.getMeshData().getVertexBuffer()==null || !(batch.getMeshData().getVertexBuffer().limit()==vertexCount*3))
        {
        	if (batch.getMeshData().getVertexBuffer()!=null)
        	{
        		ExactBufferPool.releaseVector3Buffer(batch.getMeshData().getVertexBuffer());
        	}
        	batch.getMeshData().setVertexBuffer(ExactBufferPool.getVector3Buffer(vertexCount));
        }
        batch.getMeshData().updateVertexCount();
        //batch.setVertexBuffer(BufferUtils.createVector3Buffer(batch
          //      .getVertexBuffer(), batch.getVertexCount()));
        Vector3 point = new Vector3();
        for (int x = 0; x < size; x++) {
            for (int y = 0; y < size; y++) {
                point.set(x * stepScale.getX(), heightMap[x + (y * size)]
                        * stepScale.getY(), y * stepScale.getZ());
                BufferUtils.setInBuffer(point, batch.getMeshData().getVertexBuffer(),
                        (x + (y * size)));
            }
        }

    }

    /**
     * <code>buildTextureCoordinates</code> calculates the texture coordinates
     * of the terrain.
     */
    public void buildTextureCoordinates() {
        float offsetX = offset.getXf() + (offsetAmount * stepScale.getYf());
        float offsetY = offset.getYf() + (offsetAmount * stepScale.getZf());
        Mesh batch = this;

        FloatBuffer texs = null;
        if (batch.getMeshData().getTextureCoords(0)==null || batch.getMeshData().getTextureCoords(0).getBuffer()==null || !(batch.getMeshData().getTextureCoords(0).getBuffer().limit()==batch.getMeshData().getVertexCount()*2))
        {
        	if (batch.getMeshData().getTextureCoords(0)!=null && batch.getMeshData().getTextureCoords(0).getBuffer()!=null)
        	{
        		ExactBufferPool.releaseVector2Buffer(batch.getMeshData().getTextureCoords(0).getBuffer());
        	}
        	batch.getMeshData().setTextureCoords(new FloatBufferData(ExactBufferPool.getVector2Buffer(batch.getMeshData().getVertexCount()),2),0);
        	//batch.getTextureCoords(0).coords = ;
        }
        texs = batch.getMeshData().getTextureCoords(0).getBuffer();
        //FloatBuffer texs = BufferUtils.createVector2Buffer(batch
          //      .getTextureBuffers().get(0), batch.getVertexCount());
        //batch.getTextureBuffers().set(0, texs);
        texs.clear();

        batch.getMeshData().getVertexBuffer().rewind();
        for (int i = 0; i < batch.getMeshData().getVertexCount(); i++) {
            texs.put((batch.getMeshData().getVertexBuffer().get() + offsetX)
                    / (stepScale.getXf() * (totalSize - 1)));
            batch.getMeshData().getVertexBuffer().get(); // ignore vert y coord.
            texs.put((batch.getMeshData().getVertexBuffer().get() + offsetY)
                    / (stepScale.getZf() * (totalSize - 1)));
        }
    }

    /**
     * <code>buildNormals</code> calculates the normals of each vertex that
     * makes up the block of terrain.
     */
    private void buildNormals() {
    	// here's the tricky part -->
    	// we use Big Sized VertexBuffer with the additional plus vertex for the next adj/opp Cube height
    	// but put the normals into the small sized normals map
    	// (check helperNormalIndex trick, and checking the plus column skip.)
    	
        Mesh batch = this;

        if (batch.getMeshData().getNormalBuffer()==null || !(batch.getMeshData().getNormalBuffer().limit()==batch.getMeshData().getVertexCount()*3))
        {
        	if (batch.getMeshData().getNormalBuffer()!=null)
        	{
        		ExactBufferPool.releaseVector3Buffer(batch.getMeshData().getNormalBuffer());
        	}
        	batch.getMeshData().setNormalBuffer(ExactBufferPool.getVector3Buffer(batch.getMeshData().getVertexCount()));
        }
        //batch.setNormalBuffer(BufferUtils.createVector3Buffer(batch
          //      .getNormalBuffer(), batch.getVertexCount()));
        Vector3 oppositePoint = new Vector3();
        Vector3 adjacentPoint = new Vector3();
        Vector3 rootPoint = new Vector3();
        Vector3 tempNorm = new Vector3();
        int size = helperSize;
        int adj = 0, opp = 0, normalIndex = 0;
        int helperNormalIndex = 0;
        for (int row = 0; row < size; row++) {
            for (int col = 0; col < size; col++) {
            	if (row==size-1)
            	{
            		break;
            	}
            	if (col==size-1)
            	{
            		helperNormalIndex++;
            		continue;
            	}
                BufferUtils.populateFromBuffer(rootPoint, batch
                        .getMeshData().getVertexBuffer(), normalIndex);
                if (row == size - 1) {
                    if (col == size - 1) { // last row, last col
                        // up cross left
                        adj = helperNormalIndex - size;
                        opp = helperNormalIndex - 1;
                    } else { // last row, except for last col
                        // right cross up
                        adj = helperNormalIndex + 1;
                        opp = helperNormalIndex - size;
                    }
                } else {
                    if (col == size - 1) { // last column except for last row
                        // left cross down
                        adj = helperNormalIndex - 1;
                        opp = helperNormalIndex + size;
                    } else { // most cases
                        // down cross right
                        adj = helperNormalIndex + size;
                        opp = helperNormalIndex + 1;
                    }
                }
                
                //  X   X
                //
                //  X   X
                //
                BufferUtils.populateFromBuffer(adjacentPoint, helperBatch
                        .getMeshData().getVertexBuffer(), adj);
                BufferUtils.populateFromBuffer(oppositePoint, helperBatch
                        .getMeshData().getVertexBuffer(), opp);
                
                tempNorm.set(adjacentPoint).subtractLocal(rootPoint)
                        .crossLocal(oppositePoint.subtractLocal(rootPoint))
                        .normalizeLocal();
                BufferUtils.setInBuffer(tempNorm, batch.getMeshData().getNormalBuffer(),
                        normalIndex);
                normalIndex++;helperNormalIndex++;
                }
        }
        // free the vertex buffer of the helperbatch, not needed anymore
        ExactBufferPool.releaseVector3Buffer(helperBatch.getMeshData().getVertexBuffer());
        helperBatch.getMeshData().setVertexBuffer(null);
    }
    
    /**
     * Sets the colors for each vertex to the color white.
     */
    private void buildColors() {
        setDefaultColor(ColorRGBA.WHITE);
    }

    /**
     * Returns the height map this terrain block is using.
     * 
     * @return This terrain block's height map.
     */
    public float[] getHeightMap() {
        return heightMap;
    }

    /**
     * Returns the offset amount this terrain block uses for textures.
     * 
     * @return The current offset amount.
     */
    public float getOffsetAmount() {
        return offsetAmount;
    }

    /**
     * Returns the step scale that stretches the height map.
     * 
     * @return The current step scale.
     */
    public Vector3 getStepScale() {
        return stepScale;
    }

    /**
     * Returns the total size of the terrain.
     * 
     * @return The terrain's total size.
     */
    public int getTotalSize() {
        return totalSize;
    }

    /**
     * Returns the size of this terrain block.
     * 
     * @return The current block size.
     */
    public int getSize() {
        return size;
    }

    /**
     * If true, the terrain is created as a ClodMesh. This is only usefull as a
     * call after the default constructor.
     * 
     * @param useClod
     */
    public void setUseClod(boolean useClod) {
        this.useClod = useClod;
    }

    /**
     * Returns the current offset amount. This is used when building texture
     * coordinates.
     * 
     * @return The current offset amount.
     */
    public Vector2 getOffset() {
        return offset;
    }

    /**
     * Sets the value for the current offset amount to use when building texture
     * coordinates. Note that this does <b>NOT </b> rebuild the terrain at all.
     * This is mostly used for outside constructors of terrain blocks.
     * 
     * @param offset
     *            The new texture offset.
     */
    public void setOffset(Vector2 offset) {
        this.offset = offset;
    }

    /**
     * Returns true if this TerrainBlock was created as a clod.
     * 
     * @return True if this terrain block is a clod. False otherwise.
     */
    public boolean isUseClod() {
        return useClod;
    }

    /**
     * Sets the size of this terrain block. Note that this does <b>NOT </b>
     * rebuild the terrain at all. This is mostly used for outside constructors
     * of terrain blocks.
     * 
     * @param size
     *            The new size.
     */
    public void setSize(int size) {
        this.size = size;
    }

    /**
     * Sets the total size of the terrain . Note that this does <b>NOT </b>
     * rebuild the terrain at all. This is mostly used for outside constructors
     * of terrain blocks.
     * 
     * @param totalSize
     *            The new total size.
     */
    public void setTotalSize(int totalSize) {
        this.totalSize = totalSize;
    }

    /**
     * Sets the step scale of this terrain block's height map. Note that this
     * does <b>NOT </b> rebuild the terrain at all. This is mostly used for
     * outside constructors of terrain blocks.
     * 
     * @param stepScale
     *            The new step scale.
     */
    public void setStepScale(Vector3 stepScale) {
        this.stepScale = stepScale;
    }

    /**
     * Sets the offset of this terrain texture map. Note that this does <b>NOT
     * </b> rebuild the terrain at all. This is mostly used for outside
     * constructors of terrain blocks.
     * 
     * @param offsetAmount
     *            The new texture offset.
     */
    public void setOffsetAmount(float offsetAmount) {
        this.offsetAmount = offsetAmount;
    }

    /**
     * Sets the terrain's height map. Note that this does <b>NOT </b> rebuild
     * the terrain at all. This is mostly used for outside constructors of
     * terrain blocks.
     * 
     * @param heightMap
     *            The new height map.
     */
    public void setHeightMap(float[] heightMap) {
        this.heightMap = heightMap;
    }
    public void setHeightMaps(float[][] heightMaps) {
        this.heightMap = heightMaps[0];
        this.helperHeightMap = heightMaps[1];
    }

    /**
     * Updates the block's vertices and normals from the current height map
     * values.
     */
    public void updateFromHeightMap() {
        if (!hasChanged())
            return;
        Mesh batch = this;

        Vector3 point = new Vector3();
        for (int x = 0; x < size; x++) {
            for (int y = 0; y < size; y++) {
                point.set(x * stepScale.getX(), heightMap[x + (y * size)]
                        * stepScale.getY(), y * stepScale.getZ());
                BufferUtils.setInBuffer(point, batch.getMeshData().getVertexBuffer(),
                        (x + (y * size)));
            }
        }

        // check if the helperBatch vertex buffer was released before, refill if so...
        int vertexCount = helperHeightMap.length;
        if (helperBatch.getMeshData().getVertexBuffer()==null || !(helperBatch.getMeshData().getVertexBuffer().limit()==vertexCount*3))
        {
        	if (helperBatch.getMeshData().getVertexBuffer()!=null)
        	{
        		ExactBufferPool.releaseVector3Buffer(helperBatch.getMeshData().getVertexBuffer());
        	}
        	helperBatch.getMeshData().setVertexBuffer(ExactBufferPool.getVector3Buffer(vertexCount));
        }
        helperBatch.getMeshData().updateVertexCount();
        
        for (int x = 0; x < helperSize; x++) {
            for (int y = 0; y < helperSize; y++) {
                point.set(x * stepScale.getX(), helperHeightMap[x + (y * helperSize)]
                        * stepScale.getY(), y * stepScale.getZ());
                BufferUtils.setInBuffer(point, helperBatch.getMeshData().getVertexBuffer(),
                        (x + (y * helperSize)));
            }
        }
        
        buildNormals();

        /*if (batch.getVBOInfo() != null) {
            batch.getVBOInfo().setVBOVertexID(-1);
            batch.getVBOInfo().setVBONormalID(-1);
            DisplaySystem.getDisplaySystem().getRenderer().deleteVBO(
                    getVertexBuffer(0));
            DisplaySystem.getDisplaySystem().getRenderer().deleteVBO(
                    getNormalBuffer(0));
        }*/
    }

    /**
     * <code>setHeightMapValue</code> sets the value of this block's height
     * map at the given coords
     * 
     * @param x
     * @param y
     * @param newVal
     */
    public void setHeightMapValue(int x, int y, int newVal) {
        heightMap[x + (y * size)] = newVal;
    }

    /**
     * <code>setHeightMapValue</code> adds to the value of this block's height
     * map at the given coords
     * 
     * @param x
     * @param y
     * @param toAdd
     */
    public void addHeightMapValue(int x, int y, int toAdd) {
        heightMap[x + (y * size)] += toAdd;
    }

    /**
     * <code>setHeightMapValue</code> multiplies the value of this block's
     * height map at the given coords by the value given.
     * 
     * @param x
     * @param y
     * @param toMult
     */
    public void multHeightMapValue(int x, int y, int toMult) {
        heightMap[x + (y * size)] *= toMult;
    }

    protected boolean hasChanged() {
        boolean update = false;
        if (oldHeightMap == null) {
            oldHeightMap = new float[heightMap.length];
            update = true;
        }

        for (int x = 0; x < oldHeightMap.length; x++)
            if (oldHeightMap[x] != heightMap[x] || update) {
                update = true;
                oldHeightMap[x] = heightMap[x];
            }

        return update;
    }

    /**
     * @return Returns the quadrant.
     */
    public short getQuadrant() {
        return quadrant;
    }

    /**
     * @param quadrant
     *            The quadrant to set.
     */
    public void setQuadrant(short quadrant) {
        this.quadrant = quadrant;
    }

    public void write(Ardor3dExporter e) throws IOException {
   /*     super.write(e);
        OutputCapsule capsule = e.getCapsule(this);
        capsule.write(size, "size", 0);
        capsule.write(totalSize, "totalSize", 0);
        capsule.write(quadrant, "quadrant", (short) 1);
        capsule.write(stepScale, "stepScale", Vector3.ZERO);
        capsule.write(useClod, "useClod", false);
        capsule.write(offset, "offset", new Vector2f());
        capsule.write(offsetAmount, "offsetAmount", 0);
        capsule.write(heightMap, "heightMap", null);
        capsule.write(oldHeightMap, "oldHeightMap", null);
    */}

    public void read(Ardor3dImporter e) throws IOException {
        //super.read(e);
      /*  com.ardor3d.util.export.InputCapsule capsule = e.getCapsule(this);
        size = capsule.readInt("size", 0);
        totalSize = capsule.readInt("totalSize", 0);
        quadrant = capsule.readShort("quadrant", (short) 1);
        stepScale = (Vector3) capsule.readSavable("stepScale", new Vector3(
                Vector3.ZERO));
        useClod = capsule.readBoolean("useClod", false);
        offset = (Vector2f) capsule.readSavable("offset", new Vector2f());
        offsetAmount = capsule.readFloat("offsetAmount", 0);
        heightMap = capsule.readIntArray("heightMap", null);
        oldHeightMap = capsule.readIntArray("oldHeightMap", null);
  */  }
    
    PoolItemContainer pic;

	public PoolItemContainer getPooledContainer() {
		return pic;
	}

	public void setPooledContainer(PoolItemContainer cont) {
		pic = cont;
		
	}

	public void update(NodePlaceholder place) {
		// TODO Auto-generated method stub
		
	}
}