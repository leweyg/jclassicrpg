package org.jcrpg.threed.engine.geometryinstancing;

import java.nio.FloatBuffer;

import com.ardor3d.scenegraph.Mesh;

/**
 * <code>GeometryBatchTangentSpatialInstance</code> extends <code>GeometryBatchSpatialInstance</code>
 * and adds tangent buffers to an instance.
 *
 * @author Patrik Lindegran
 */
public class GeometryBatchTangentSpatialInstance<A extends GeometryBatchInstanceAttributes> extends GeometryBatchSpatialInstance<A> {
	private FloatBuffer tangentBufDst;
	private FloatBuffer tangentBufSrc;
	
    public GeometryBatchTangentSpatialInstance(Mesh mesh, FloatBuffer tangentBufSrc, A attributes) {
        super(mesh, attributes);
        this.tangentBufSrc = tangentBufSrc;
    }    
    
    public void setTangentBuffer(FloatBuffer tangentBufDst) {
		this.tangentBufDst = tangentBufDst;
	}
    
    protected void commitTangents() {
    	if (tangentBufSrc != null && tangentBufDst != null) {
        	if (transformed && attributes.isVisible()) {
        		tangentBufSrc.rewind();
	            for (int i = 0; i < instanceBatch.getMeshData().getVertexCount(); i++) {
	                worldVector.set(tangentBufSrc.get(), tangentBufSrc.get(), tangentBufSrc.get());
	                // TODO ardor3d attributes.getNormalMatrix().multiply(worldVector, worldVector);
	                worldVector.normalizeLocal();
	                tangentBufDst.put(worldVector.getXf());
	                tangentBufDst.put(worldVector.getYf());
	                tangentBufDst.put(worldVector.getZf());
	            }
        	} else {
        		skipBuffer(tangentBufSrc, tangentBufDst);
        	}
        }
    }
    
    protected void commitNormals(Mesh batch) {
    	super.commitNormals(batch);
    	commitTangents();    	
    }
}