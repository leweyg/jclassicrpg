package org.jcrpg.threed.engine.geometryinstancing;

import java.nio.Buffer;
import java.nio.FloatBuffer;

import org.jcrpg.threed.engine.TiledTerrainBlockUnbuffered;
import org.jcrpg.threed.engine.geometryinstancing.instance.GeometryInstance;

import com.ardor3d.math.Vector3;
import com.ardor3d.scenegraph.IndexBufferData;
import com.ardor3d.scenegraph.Mesh;

/**
 * <code>GeometryBatchSpatialInstance</code> uses <code>GeometryBatchInstanceAttributes</code>
 * to define an instance of object in world space. Uses Geometry as source
 * data for the instance.
 *
 * @author Paul Illes - removed tmpVertexBuffer, using the original vertex buffer instead, saving memory
 * @author Patrik Lindegran
 */
public class GeometryBatchSpatialInstance<A extends GeometryBatchInstanceAttributes> extends GeometryInstance<A> {
	public Mesh mesh;
	protected AABB modelBound;
	
	public boolean hashBasedDeltaGeneration = false;
	public int hashSeed = 0;
	
	protected Mesh instanceBatch = null;
	
	protected boolean transformed = false;
	private boolean updateVerts = false;
	private boolean updateIndices = true;
	
	protected boolean forceUpdate = false;
	
	public GeometryBatchSpatialInstance(Mesh mesh, A attributes) {
        super(attributes);
        this.mesh = mesh;
        instanceBatch = mesh;
        modelBound = new AABB();
    }
	public GeometryBatchSpatialInstance(Mesh mesh, A attributes, int seed) {
        super(attributes);
        this.mesh = mesh;
        instanceBatch = mesh;
        modelBound = new AABB();
        hashSeed = seed;
        hashBasedDeltaGeneration = true;
    }
	public void setSeed(boolean on, int seed)
	{
		hashBasedDeltaGeneration = on;
		hashSeed = seed;
	}
	
	/** Update Mesh needs to be called when the mesh is changed (does not support a change of the number of vertices) */
	public void updateMesh() {
		forceUpdate = true;
	}

    /** Vector used to store and calculate world transformations */
    protected Vector3 worldVector = new Vector3();
    
    protected boolean wantCommit() {
    	return updateVerts || updateIndices || attributes.isColorChanged();
    }
    
    /** Calculate vertices if batch or attributes has changed */
    public boolean preCommit(boolean forceUpdate) {
    	if (forceUpdate) {
    		this.forceUpdate = true;
    		this.updateIndices = true;
    	}
    	
    	if ((forceUpdate || attributes.isTransformed())) {
    		updateVerts = true;
    		// removed tmpVertBuffer filling from here - Paul
    		attributes.setTransformed(false);
     	}
    	return wantCommit();
    }
    
    /**
     * Uses the instanceAttributes to transform the instanceBatch into world
     * coordinates. The transformed instance batch is added to the batch.
     *
     * @param batch
     */
    public void commit(Mesh batch, boolean force) {
    	Object sync = mesh;
    	if (mesh instanceof TiledTerrainBlockUnbuffered)
    	{
    		sync = TiledTerrainBlockUnbuffered.SHARED_VERTEX_BUFFER;
    	}
    	synchronized (sync) // synch so the buffers position wont get screwed in parallel threads..
    	{
			
	    	if (mesh instanceof TiledTerrainBlockUnbuffered)
	        {
	        	// the tricky part for tiled terrain blocks -- reallocate from pool/rebuild buffers if not present (were released) 
	        	TiledTerrainBlockUnbuffered ttbu = (TiledTerrainBlockUnbuffered)mesh;
	       		ttbu.rebuildBuffers();
	       		
	        }
	        int indexStart = commitVertices(batch);
	        commitIndices(batch, indexStart);
	        commitNormals(batch);
	        commitTextureCoords(batch);
	        commitColors(batch);
	        
	        /* not needed anymore with the shared buffers... commenting out
	        if (mesh instanceof TiledTerrainBlockUnbuffered)
	        {
	        	// releasing the buffers for other TTBUs to use - saving helluva lotsa memory...
	        	GeometryBatchMesh.releaseBatchExact(((TiledTerrainBlockUnbuffered)mesh),false);
	        	((TiledTerrainBlockUnbuffered)mesh).releaseExtraBuffers();
	        }*/
	
	        if(attributes.isVisible()) {
	        	transformed = false;
	        	forceUpdate = false;
	            attributes.setColorChanged(false);
	        }
    	}
    }
 
   
    protected void skipBuffer(Buffer bufferSrc, Buffer bufferDst) {
    	if( bufferSrc == null || bufferDst == null ) {
    		return;
    	}
    	bufferDst.position(bufferDst.position() + bufferSrc.limit());
    }
    
    protected void skipBuffer(int size, Buffer bufferDst) {
    	if( bufferDst == null ) {
    		return;
    	}
    	bufferDst.position(bufferDst.position() + size);
    }
    
    protected int commitVertices(FloatBuffer vertBufSrc, FloatBuffer vertBufDst) {
    	if( vertBufSrc == null || vertBufDst == null ) {
    		return 0;
    	}
    	//float r = new Random().nextFloat()*100;
    	int indexStart = vertBufDst.position() / 3;
    	// filling from original vertexbuffer here at commit time instead of preCommit tmpVertexBuffer - Paul
		if (GeometryBatchMesh.OWN_BOUNDING)
			modelBound.reset();
		if(attributes.isVisible()) {	    			
			transformed = true;
			synchronized (vertBufSrc)
			{
	            vertBufSrc.rewind();		            
	            for (int i = 0; i < instanceBatch.getMeshData().getVertexCount(); i++) {
	                worldVector.set(vertBufSrc.get(), vertBufSrc.get(),
	                                vertBufSrc.get());
	                attributes.getWorldTransform().applyForward(worldVector,worldVector);
	        		if (GeometryBatchMesh.OWN_BOUNDING)
	        			modelBound.expand(worldVector);
	                vertBufDst.put(worldVector.getXf());
	                vertBufDst.put(worldVector.getYf());
	                vertBufDst.put(worldVector.getZf());
	                
	            }
			}
		} else {
			for (int i = 0; i < vertBufSrc.capacity(); i++) {
				vertBufDst.put(0.0f);
            }
		}
		
        return indexStart;
    }
    
    protected int commitVertices(Mesh batch) {
    	// Vertex buffer
    	FloatBuffer vertBufSrc = instanceBatch.getMeshData().getVertexBuffer();
       	if (updateVerts) {
            updateVerts = false;
            return commitVertices(vertBufSrc, batch.getMeshData().getVertexBuffer());
    	}
    	skipBuffer(vertBufSrc, batch.getMeshData().getVertexBuffer());
        return 0;
    }
    
    protected void commitIndices(Mesh batch, int indexStart) {
    	if (!(instanceBatch instanceof Mesh && batch instanceof Mesh)) {
    		return;
    	}
    	// Index buffer        
    	if (updateIndices) {
    		IndexBufferData indexBufSrc = instanceBatch.getMeshData().getIndices();
    		IndexBufferData indexBufDst = batch.getMeshData().getIndices();
            if (indexBufSrc != null && indexBufDst != null) {
        		updateIndices = false;
        		synchronized ( indexBufSrc )
        		{
		            indexBufSrc.getBuffer().rewind();
		            for (int i = 0; i < getNumIndices(); i++) {
		            	indexBufDst.put(indexStart + indexBufSrc.get());
		            }
        		}
        	} 
        } else {
    		skipBuffer(((Mesh)instanceBatch).getMeshData().getIndices().getBuffer(), ((Mesh)batch).getMeshData().getIndices().getBuffer());
    	}
    }
    
    protected void commitNormals(FloatBuffer normalBufSrc, FloatBuffer normalBufDst) {
    	if(normalBufSrc == null || normalBufDst == null) {
    		return;
    	}
    	synchronized (normalBufSrc)
    	{
	    	normalBufSrc.rewind();
	        for (int i = 0; i < instanceBatch.getMeshData().getVertexCount(); i++) {
	            worldVector.set(normalBufSrc.get(), normalBufSrc.get(),
	                            normalBufSrc.get());
	            attributes.getNormalTransform().applyForward(worldVector,worldVector);
	            worldVector.normalizeLocal();
	            normalBufDst.put(worldVector.getXf());
	            normalBufDst.put(worldVector.getYf());
	            normalBufDst.put(worldVector.getZf());
	        }
    	}
    }
    
    protected void commitNormals(Mesh batch) {
    	// Normal buffer
    	if ((forceUpdate || transformed) && attributes.isVisible()) {
    		commitNormals(instanceBatch.getMeshData().getNormalBuffer(), batch.getMeshData().getNormalBuffer());
    	} else {
    		skipBuffer(instanceBatch.getMeshData().getNormalBuffer(), batch.getMeshData().getNormalBuffer());
    	}
    }
        
    protected void commitTextureCoords(Mesh batch) {
    	// Texture buffers
        for (int i = 0; i < 8; i++) {
            FloatBuffer texBufSrc = instanceBatch.getMeshData().getTextureCoords(i)!=null?instanceBatch.getMeshData().getTextureCoords(i).getBuffer():null;
            FloatBuffer texBufDst = batch.getMeshData().getTextureCoords(i)!=null?batch.getMeshData().getTextureCoords(i).getBuffer():null;
	            if (texBufSrc != null && texBufDst != null) {
	            	if (forceUpdate && attributes.isVisible()) {
	                	synchronized (texBufSrc)
	                	{
	                		texBufSrc.rewind();
	                		texBufDst.put(texBufSrc);
	                	}
	            	} else {
	            		skipBuffer(texBufSrc, texBufDst);
	            	}
	            }
        }
    }
    
	protected void commitColors(Mesh batch) {
	 // Color buffer
	    FloatBuffer colorBufSrc = instanceBatch.getMeshData().getColorBuffer();
	    FloatBuffer colorBufDst = batch.getMeshData().getColorBuffer();
	    if (colorBufSrc != null && colorBufDst != null) {
	    	synchronized (colorBufSrc)
	    	{
		    	if ((forceUpdate || attributes.isColorChanged()) && attributes.isVisible()) {
		            colorBufSrc.rewind();
		            for (int i = 0; i < instanceBatch.getMeshData().getVertexCount(); i++) {
		                colorBufDst.put(colorBufSrc.get() * attributes.getColor().getRed());
		                colorBufDst.put(colorBufSrc.get() * attributes.getColor().getGreen());
		                colorBufDst.put(colorBufSrc.get() * attributes.getColor().getBlue());
		                colorBufDst.put(colorBufSrc.get() * attributes.getColor().getAlpha());
		            }
		    	} else {
		    		skipBuffer(colorBufSrc, colorBufDst);
		    	}
	    	}	        
	    } else if (colorBufDst != null) {
	    	if ((forceUpdate || attributes.isColorChanged()) && attributes.isVisible()) {
	            for (int i = 0; i < instanceBatch.getMeshData().getVertexCount(); i++) {
	                colorBufDst.put(attributes.getColor().getRed());
	                colorBufDst.put(attributes.getColor().getGreen());
	                colorBufDst.put(attributes.getColor().getBlue());
	                colorBufDst.put(attributes.getColor().getAlpha());
	            }
	    	} else {
	    		skipBuffer(instanceBatch.getMeshData().getVertexCount() * 4, colorBufDst);
	    	}
	    }
	}

    public int getNumIndices() {
        if (instanceBatch == null) {
            return 0;
        }
        if ((instanceBatch instanceof Mesh)) {
        	
        	return instanceBatch.getMeshData().getIndices().getBufferLimit();
        }
        return 0;
    }

    public int getNumVerts() {
        if (instanceBatch == null) {
            return 0;
        }
        return instanceBatch.getMeshData().getVertexCount();
    }

	public AABB getModelBound() {
		return modelBound;
	}
}