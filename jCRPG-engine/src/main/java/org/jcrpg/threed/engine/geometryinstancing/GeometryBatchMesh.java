package org.jcrpg.threed.engine.geometryinstancing;

import java.nio.Buffer;
import java.nio.FloatBuffer;
import java.nio.IntBuffer;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;

import org.jcrpg.threed.J3DCore;
import org.jcrpg.threed.engine.TiledTerrainBlock;
import org.jcrpg.threed.engine.TiledTerrainBlockUnbuffered;

import com.ardor3d.bounding.BoundingBox;
import com.ardor3d.bounding.BoundingVolume;
import com.ardor3d.renderer.Renderer;
import com.ardor3d.scenegraph.FloatBufferData;
import com.ardor3d.scenegraph.Mesh;
import com.ardor3d.scenegraph.event.DirtyType;
import com.ardor3d.scenegraph.hint.CullHint;

/**
 * <code>GeometryBatchMesh</code> is a container class for <code>GeometryInstances</code>, which
 * contains the batch created from the instances.
 *
 * @author Patrik Lindegran
 * @author Pal Zoltan Illes
 */

public class GeometryBatchMesh<T extends GeometryBatchSpatialInstance<?>> extends Mesh {
	private static final long serialVersionUID = 0L;	
    protected ArrayList<T> instances;
    private int nVerts;
    private int nIndices;
    private AABB modelBound;
    
    private boolean commit = false;    
    public boolean reconstruct = false;
	
	public GeometryBatchMesh() {
		init();
    }
	
	public GeometryBatchMesh(String name) {
		super(name);
		init();
    }
	
	public static final boolean OWN_BOUNDING = false;
	
	private void init() {
		instances = new ArrayList<T>(1);
        if (!OWN_BOUNDING)
        {
        	setModelBound(new BoundingBox());
        } else
        {
        	modelBound = new AABB();
        }
	}
	
	public int getNumInstances() {
        if(instances == null) {
            return 0;
        }            
        return instances.size();
    }
	
    public void clearInstances() {
        instances.clear();
        if (OWN_BOUNDING)
        	modelBound.reset();
        nVerts = 0;
        nIndices = 0;
    }

    public void addInstance(T geometryInstance) {
        if (geometryInstance == null) {
            return;
        }
        synchronized (instances)
        {
	        instances.add(geometryInstance);
	        nIndices += geometryInstance.getNumIndices();
	        nVerts += geometryInstance.getNumVerts();
	        reconstruct = true;
	        /* WITH Shared Buffers this is not done like that anymore
	         * if (geometryInstance.mesh instanceof TiledTerrainBlockUnbuffered)
	        {
	        	// releasing the buffers to pool for making it available for other tiledTerrainBlocks! saving memory :)
	        	releaseBatchExact(((TiledTerrainBlockUnbuffered)geometryInstance.mesh).getBatch(0),false);
	        	((TiledTerrainBlockUnbuffered)geometryInstance.mesh).releaseExtraBuffers();
	        }*/
        }
        markDirty(DirtyType.RenderState);
        markDirty(DirtyType.Bounding);
    }

    public void removeInstance(T geometryInstance) {
        synchronized (instances)
        {
	        if (instances.remove(geometryInstance)) {
	            nIndices -= geometryInstance.getNumIndices();
	            nVerts -= geometryInstance.getNumVerts();
	        }
	        reconstruct = true;
        }
        markDirty(DirtyType.Bounding);
    }

    public int getNumVertices() {
        return nVerts;
    }

    public int getNumIndices() {
        return nIndices;
    }

    public ArrayList<T> getInstances() {
        return instances;
    }
    
    private void updateBound() {
    	if (commit) {
            synchronized (instances)
            {
	    		modelBound.reset();
		        for (T instance : instances) {
		            if( instance.getAttributes().isVisible() ) {
		            	modelBound.mergeLocal(instance.getModelBound());
		        	}
		        }
		        modelBound.getBoundingBox(b);
            }
    	}
    }
    
    BoundingBox b = new BoundingBox();
   
    @Override
	public BoundingVolume getModelBound(BoundingVolume store) {
    	b.clone(store);
    	return b;
	}

    private boolean needsPrecommit = true;
    
	public boolean isNeedsPrecommit() {
		return needsPrecommit;
	}

	public void setNeedsPrecommit(boolean needsPrecommit) {
		this.needsPrecommit = needsPrecommit;
	}
	
	
	
	
	public static boolean PARALLEL_COMMIT = false;
	
	Runnable r = new Runnable() {
		
		public void run() {
			parallelCommit();
		}
	};


	private boolean dBuffersReady = false;
	private boolean parallelCommitInProgress = false;
	
	private void swapToDoubleBuffers()
	{
		releaseBuffers();
		setIndexBuffer(indexBufferD);
		setVertexBuffer(vertexBufferD);
		setNormalBuffer(normalBufferD);
		setColorBuffer(colorBufferD);
		for (int i=0; i<textureBufferD.size(); i++)
		{
			FloatBuffer buff = textureBufferD.get(i);
	    	if (getMeshData().getTextureCoords(i)==null)
	    	{
	    		getMeshData().setTextureCoords(new FloatBufferData(buff,2), 0);
	    	} else
	    	{
	    		getMeshData().getTextureCoords(0).setBuffer(buff);
	    	}

		}
		dBuffersReady = false;
	}
	
	static HashSet<GeometryBatchMesh> inProgress = new HashSet<GeometryBatchMesh>();
	
	/**
	 * Does the commit in a separate thread to a set of independent new buffers
	 */
	public void parallelCommit()
	{
		if (inProgress.contains(this))
		{
			System.out.println("$$$$$$$$$$$$$$ ALREADY STARTED!!! "+_name);
		}
		inProgress.add(this);
		//System.out.println("PARALLEL COMMIT started "+_name);
		createBuffers(true);	
		doPreCommit();
		GeometryBatchMesh m = new GeometryBatchMesh();
		m.setIndexBuffer(indexBufferD);
		m.setNormalBuffer(normalBufferD);
		m.setColorBuffer(colorBufferD);
		m.setVertexBuffer(vertexBufferD);
		m.getMeshData().setTextureBuffer(textureBufferD.get(0), 0);
		doCommit(m);
		m.setIndexBuffer(null);
		m.setNormalBuffer(null);
		m.setColorBuffer(null);
		m.setVertexBuffer(null);
		m.getMeshData().setTextureCoords(null);//Buffer(null, 0);//(null);
		
		dBuffersReady = true;
		inProgress.remove(this);
		parallelCommitInProgress = false;
		//System.out.println("PARALLEL COMMIT ended "+_name);
		
	}

	private void doPreCommit()
	{
		needsPrecommit = false;
    	synchronized (instances)
    	{
	        for (T instance : instances) {
	            commit = instance.preCommit(reconstruct) || commit;
	        }
	    	reconstruct = false;
    	}
	}
	
	public Object mutex = new Object();
	
	/**
     * Calculates AABBs for all instances and then
     * Calculate the AABB for the whole batch
     */ 
    public void preCommit() {
    	preCommitStart = System.currentTimeMillis();
    	if (reconstruct) {
    		if (PARALLEL_COMMIT)
    		{
    			synchronized(mutex)
    			{
	    			if (parallelCommitInProgress) return;
	    			parallelCommitInProgress = true;
	    			new Thread(r).start();
	    			return;
    			}
    		}
    		createBuffers(false);		
    	}
    	if (isNeedsPrecommit())
    	{
    		doPreCommit();
    	}
    	preCommitTime+=System.currentTimeMillis() - preCommitStart;
    }
    
    private void doCommit(Mesh batch)
    {
    	if (commit) {
        	commitStart = System.currentTimeMillis();
	        synchronized (instances)
	        {
	        	rewindBuffers(batch);
		        for (T instance : instances) {
		            instance.commit(batch, reconstruct);
		        }
	        }
	        if (!parallelCommitInProgress)
	        {
				if (GeometryBatchMesh.OWN_BOUNDING)
					updateBound(); 
				else
					updateModelBound();
	        }
	    	commitTime+=System.currentTimeMillis() - commitStart;
	    	commit = false;

	    	if (J3DCore.SETTINGS.VBO_ENABLED)
	    	{
		    	getMeshData().getVertexCoords().setNeedsRefresh(true);
		    	getMeshData().getNormalCoords().setNeedsRefresh(true);
		    	getMeshData().getTextureCoords(0).setNeedsRefresh(true);
		    	getMeshData().getIndices().setNeedsRefresh(true);
	    	}
    	}
    }
    
    public void commit(Mesh batch) {
    	
    	if (parallelCommitInProgress) return;
    	if (PARALLEL_COMMIT && dBuffersReady)
    	{
    		swapToDoubleBuffers();
			if (GeometryBatchMesh.OWN_BOUNDING)
				updateBound(); 
			else
				updateModelBound();
	    	if (J3DCore.SETTINGS.VBO_ENABLED)
	    	{
		    	getMeshData().getVertexCoords().setNeedsRefresh(true);
		    	getMeshData().getNormalCoords().setNeedsRefresh(true);
		    	getMeshData().getTextureCoords(0).setNeedsRefresh(true);
		    	getMeshData().getIndices().setNeedsRefresh(true);
	    	}
    	} else
    	{
    		doCommit(batch);
    	}
    }
    
    public static long preCommitTime = 0;
    public static long commitTime = 0;
    public long preCommitStart = 0;
    public long commitStart = 0;
    
    public static boolean GLOBAL_CAN_COMMIT = true;
    
    @Override
    public void onDraw(Renderer r) {
    	if (getSceneHints().getCullHint() == CullHint.Always) {
    		return;
    	}
    	if (GLOBAL_CAN_COMMIT)// || !reconstruct) // not reconstruct type changes are still allowed at everytime (even at rendering phase)
    		preCommit();
    	super.onDraw(r);
    }
    
    /**
     * Forcing rebuild before draw.
     */
    public void rebuild()
    {
    	preCommit();
    	commit(this);
    }
    
    @Override
    public void draw(Renderer r) {
    	if (GLOBAL_CAN_COMMIT) // not reconstruct type changes are still allowed at everytime (even at rendering phase)
    		commit(this);
    	if (this.getMeshData().getVertexBuffer()!=null)
    		if (this.getMeshData().getIndexBuffer()!=null)
    		{
    			//System.out.println("DRAWING "+_name);
    			super.draw(r);
    		}
    }
    
    /*******************************************************************
     * Buffers
     *******************************************************************/
    
    
    private IntBuffer getIndexBuffer()
    {
    	return (IntBuffer)getMeshData().getIndexBuffer();
    }
    private void setIndexBuffer(IntBuffer buff)
    {
    	getMeshData().setIndexBuffer(buff);
    }
    
    private FloatBuffer getVertexBuffer()
    {
    	return getMeshData().getVertexBuffer();
    }
    private void setVertexBuffer(FloatBuffer buff)
    {
    	getMeshData().setVertexBuffer(buff);
    }
    
    private FloatBuffer getNormalBuffer()
    {
    	return getMeshData().getNormalBuffer();
    }
    private void setNormalBuffer(FloatBuffer buff)
    {
    	getMeshData().setNormalBuffer(buff);
    }
    
    private FloatBuffer getColorBuffer()
    {
    	return getMeshData().getColorBuffer();
    }
    private void setColorBuffer(FloatBuffer buff)
    {
    	getMeshData().setColorBuffer(buff);
    }
    
    public IntBuffer indexBufferD;
    public FloatBuffer vertexBufferD;
    public FloatBuffer normalBufferD;
    public FloatBuffer colorBufferD;
    public ArrayList<FloatBuffer> textureBufferD = new ArrayList<FloatBuffer>();
    
  
    public void createIndexBufferD() {
    	indexBufferD = BufferPool.getIntBuffer(getNumIndices());
    }
    public void createVertexBufferD() {
    	vertexBufferD = BufferPool.getVector3Buffer(getNumVertices());
    }
    public void createColorBufferD() {
    	colorBufferD = BufferPool.getFloatBuffer(_name,getNumVertices() * 4);
    }
    public void createNormalBufferD() {
    	normalBufferD = BufferPool.getVector3Buffer(getNumVertices());
    }
    public void createTextureBufferD(int unit) {
    	FloatBuffer buff = BufferPool.getVector2Buffer(getNumVertices());
    	textureBufferD.add(unit,buff);
    }
    
    public void createIndexBuffer() {
    	IntBuffer buff = getIndexBuffer();
    	if (buff!=null && buff.capacity()>0)
    	{
    		/*if (buff.capacity()>=getNumIndices())
    		{ // XXX it doesnt work to use the index buffer with fewer indices!! i've commented this out.
    			buff.clear();
    			buff.limit(getNumIndices());
    			buff.rewind();
    			return;
    		} else*/
    		{
    			BufferPool.releaseIntBuffer(buff);
    		}
    	}
    	setIndexBuffer(BufferPool.getIntBuffer(getNumIndices()));
    	//setIndexBuffer(BufferUtils.createIntBuffer(getNumIndices()));
    }
    
    public void createVertexBuffer() {
    	FloatBuffer buff = getVertexBuffer();
    	if (buff!=null && buff.capacity()>0)
    	{
    		if (buff.capacity()>=getNumVertices()*3)
    		{
    			buff.clear();
    			buff.limit(getNumVertices()*3);
    			buff.rewind();
    			return;
    		} else
    		{
    			BufferPool.releaseVector3Buffer(buff);
    		}
    	}
    	setVertexBuffer(BufferPool.getVector3Buffer(getNumVertices()));
    	//setVertexBuffer(BufferUtils.createVector3Buffer(getNumVertices()));
    }
    
    public void createNormalBuffer() {
    	FloatBuffer buff = getNormalBuffer();
    	if (buff!=null && buff.capacity()>0)
    	{
    		if (buff.capacity()>=getNumVertices()*3)
    		{
    			buff.clear();
    			buff.limit(getNumVertices()*3);
    			buff.rewind();
    			return;
    		} else
    		{
    			BufferPool.releaseVector3Buffer(buff);
    		}
    	}
    	setNormalBuffer(BufferPool.getVector3Buffer(getNumVertices()));
    	//setNormalBuffer(BufferUtils.createVector3Buffer(getNumVertices()));
    }
    
    public void createColorBuffer() {
    	FloatBuffer buff = getColorBuffer();
    	if (buff!=null && buff.capacity()>0)
    	{
    		if (buff.capacity()>=getNumVertices()*4)
    		{
    			buff.clear();
    			buff.limit(getNumVertices()*4);
    			buff.rewind();
    			return;
    		} else
    		{
    			BufferPool.releaseFloatBuffer(_name,buff);
    		}
    	}
    	setColorBuffer(BufferPool.getFloatBuffer(_name,getNumVertices() * 4));
    	//setColorBuffer(BufferUtils.createFloatBuffer  (getNumVertices() * 4));
	}
    
    public void createTextureBuffer(int textureUnit) {
    	FloatBuffer buff = getMeshData().getTextureCoords(0)!=null?getMeshData().getTextureCoords(0).getBuffer():null;
    	if (buff!=null && buff.capacity()>0)
    	{
    		if (buff.capacity()>=getNumVertices()*2)
    		{
    			buff.clear();
    			buff.limit(getNumVertices()*2);
    			buff.rewind();
    			return;
    		} else
    		{
    			BufferPool.releaseVector2Buffer(buff);
    		}
    	}
    	buff = BufferPool.getVector2Buffer(getNumVertices());
    	if (getMeshData().getTextureCoords(0)==null)
    	{
    		getMeshData().setTextureCoords(new FloatBufferData(buff,2), 0);
    	} else
    	{
    		getMeshData().getTextureCoords(0).setBuffer(buff);
    	}
    	
    }
    
    /**
     * Create the buffers
     */	
	public void createBuffers(boolean doubleBuffer) {
		if (!doubleBuffer)
		{
			createIndexBuffer();
	    	createVertexBuffer();
	    	createNormalBuffer();
	    	createColorBuffer();
	    	createTextureBuffer(0);
		} else
		{
			textureBufferD.clear();
			createIndexBufferD();
	    	createVertexBufferD();
	    	createNormalBufferD();
	    	createColorBufferD();
	    	createTextureBufferD(0);
		}
    }
    
    /**
     * Rewind a Buffer if it exists 
     * Could a function like this be a part of the batch?
     */
    private void rewindBuffer(Buffer buf) {
        if (buf != null) {
            buf.rewind();
        }
    }

    /**
     * Rewind all buffers in a batch 
     * Could a function like this be a part of the batch?
     */
    public void rewindBuffers(Mesh batch) {
        rewindBuffer(batch.getMeshData().getIndexBuffer());
        rewindBuffer(batch.getMeshData().getVertexBuffer());
        rewindBuffer(batch.getMeshData().getColorBuffer());
        rewindBuffer(batch.getMeshData().getNormalBuffer());
        List<FloatBufferData> textureBuffers = batch.getMeshData().getTextureCoords();
        for (FloatBufferData textureBuffer : textureBuffers) {
        	if (textureBuffer!=null)
        		rewindBuffer(textureBuffer.getBuffer());
		}
	}
    
    public void releaseBatch(Mesh batch)
    {
        BufferPool.releaseIntBuffer((IntBuffer)batch.getMeshData().getIndexBuffer());
        batch.getMeshData().setIndexBuffer((IntBuffer)null);
        BufferPool.releaseVector3Buffer(batch.getMeshData().getVertexBuffer());
        batch.getMeshData().setVertexBuffer(null);
        BufferPool.releaseVector3Buffer(batch.getMeshData().getNormalBuffer());
        batch.getMeshData().setNormalBuffer(null);
        BufferPool.releaseFloatBuffer(_name,batch.getMeshData().getColorBuffer());
        batch.getMeshData().setColorBuffer(null);
        
        List<FloatBufferData> textureBuffers = batch.getMeshData().getTextureCoords();
        for (FloatBufferData textureBuffer : textureBuffers) {
        	if (textureBuffer!=null)
        		BufferPool.releaseVector2Buffer(textureBuffer.getBuffer());
		}
        // TODO ardor3d batch.clearTextureBuffers();
    	batch.removeFromParent();
    	
    }

    public static void releaseBatchExact(Mesh batch, boolean clearAndRemove)
    {
		// shouldn't release only non-common-buffer
    	if (batch.getMeshData().getIndexBuffer()!=TiledTerrainBlock.COMMON_INDEX_BUFFER)
    	{
    		ExactBufferPool.releaseIntBuffer((IntBuffer)batch.getMeshData().getIndexBuffer());
    	}
    	batch.getMeshData().setIndexBuffer((IntBuffer)null);
        ExactBufferPool.releaseVector3Buffer(batch.getMeshData().getVertexBuffer());
        batch.getMeshData().setVertexBuffer(null);
        ExactBufferPool.releaseVector3Buffer(batch.getMeshData().getNormalBuffer());
        batch.getMeshData().setNormalBuffer(null);
        ExactBufferPool.releaseFloatBuffer(batch.getMeshData().getColorBuffer());
        batch.getMeshData().setColorBuffer(null);
        
        List<FloatBufferData> textureBuffers = batch.getMeshData().getTextureCoords();
        for (FloatBufferData textureBuffer : textureBuffers) {
        	if (textureBuffer!=null)
        		ExactBufferPool.releaseVector2Buffer(textureBuffer.getBuffer());
		}
        if (clearAndRemove)
        {
        	// TODO ardor3d ? batch.clearTextureBuffers();
        	batch.removeFromParent();
        }
    }
    
    public void releaseInstanceRelatedOnCleanUp()
    {
    	ArrayList<T> removables = new ArrayList<T>();
    	removables.addAll(getInstances());
       	for (T t:removables)
       	{
       		removeInstance(t);
       	}
      	for (T t:removables)
    	{
    		if (t instanceof GeometryBatchSpatialInstance)
    		{
    			GeometryBatchSpatialInstance<GeometryBatchInstanceAttributes> t2 = (GeometryBatchSpatialInstance<GeometryBatchInstanceAttributes>)t;
    			if (t2.mesh instanceof TiledTerrainBlock && !(t2.mesh instanceof TiledTerrainBlockUnbuffered))
    			{
    				//System.out.println("### RELEASING GEOTILE!");
    				if (((TiledTerrainBlock)t2.mesh)!=null)
    				{
    					releaseBatchExact(((TiledTerrainBlock)t2.mesh),true);
    				}
    				((TiledTerrainBlock)t2.mesh).releaseExtraBuffers();
     			}
    		}
    	}
    }

    public void releaseBuffersOnCleanUp()
    {
    	releaseInstanceRelatedOnCleanUp();
    	releaseBuffers();
    	removeFromParent();
    }
    public void releaseBuffers()
    {
    	
    	{
    		if (getIndexBuffer()==null || getIndexBuffer().capacity()==0) return;
	        BufferPool.releaseIntBuffer(getIndexBuffer());
	        setIndexBuffer(null);
	        BufferPool.releaseVector3Buffer(getVertexBuffer());
	        setVertexBuffer(null);
	        if (getNormalBuffer()==null) return;
	        BufferPool.releaseVector3Buffer(getNormalBuffer());
	        setNormalBuffer(null);
	        if (getColorBuffer()==null) return;
	        BufferPool.releaseFloatBuffer(_name,getColorBuffer());
	        setColorBuffer(null);
	        
	        List<FloatBufferData> textureBuffers = getMeshData().getTextureCoords();
	        for (FloatBufferData textureBuffer : textureBuffers) {
	        	if (textureBuffer!=null)
	        		BufferPool.releaseVector2Buffer(textureBuffer.getBuffer());
			}
	        // TODO ardor3d? clearTextureBuffers();
    	}
}
}