package org.jcrpg.threed.core;

import org.jcrpg.threed.J3DCore;
import org.jcrpg.threed.NodePlaceholder;
import org.jcrpg.threed.core.texture.BakingTextureStreamer;
import org.jcrpg.world.place.World;

import com.ardor3d.extension.terrain.GeometryClipmapTerrain;
import com.ardor3d.extension.terrain.HeightmapPyramid;
import com.ardor3d.extension.texturing.TextureClipmap;
import com.ardor3d.extension.texturing.TextureStreamer;
import com.ardor3d.renderer.Camera;
import com.ardor3d.renderer.state.LightState;
import com.ardor3d.renderer.state.MaterialState;
import com.ardor3d.scenegraph.Node;
import com.ardor3d.scenegraph.event.DirtyType;
import com.ardor3d.scenegraph.hint.CullHint;

public class TerrainHelper {

	public J3DCore core;
	
	public static Node terrainNode;
	
	public TerrainHelper(J3DCore core)
	{
		this.core = core;
	}

	
    final int textureSliceSize = 128;

    // Clipmap parameters and a list of clipmaps that are used.
    private final int clipLevelCount = 7;
    private  int clipSideSize = 63;
    private final float heightScale = 500;
    Camera terrainCamera = null;
    //TexturedGeometryClipmapTerrain geometryClipmapTerrain = null;
    GeometryClipmapTerrain geometryClipmapTerrain = null;
    HeightmapPyramid  heightmapPyramid = null;
    

    public static final float TEXTURE_SCALE = 10f;
    
    static boolean TEXTURED_CLIPMAP = true;
    
    public static int startingX,  startingY, startingZ;
    
    public void init(MaterialState mat, LightState light, int startingX, int startingY, int startingZ)
	{
    	this.startingX = startingX;
    	this.startingY = startingY;
    	this.startingZ = startingZ;
    	
    	if (terrainNode!=null)
    	{
    		terrainNode.removeFromParent();
    	}
		terrainNode = new Node();
		core.getGroundParentNode().attachChild(terrainNode);
		//bhm = new BasicHeightmap(heightmap, maxSize);
		w = core.gameState.world;
	
		heightmapPyramid = new WorldHeightmapPyramid(w, clipLevelCount);
        // Keep a separate camera to be able to freeze terrain update
        final Camera camera = core.getCamera();
        terrainCamera = new Camera(camera);
        
        terrainNode.setRenderState(light);
        terrainNode.setRenderState(mat);
        
        if (J3DCore.SETTINGS.VIEW_DISTANCE<60)
        {
        	clipSideSize = 31;
        }
        
        if (TEXTURED_CLIPMAP)
        {
            final TextureStreamer streamer = new BakingTextureStreamer(textureSliceSize,w);
            final TextureClipmap textureClipmap = new TextureClipmap(streamer, textureSliceSize, 6, TEXTURE_SCALE);
       // Create the monster terrain engine
        	TexturedGeometryClipmapTerrain geometryClipmapTerrain = new TexturedGeometryClipmapTerrain(textureClipmap,terrainCamera, heightmapPyramid, clipSideSize,
                heightScale);
	        geometryClipmapTerrain.setMinDist(J3DCore.SETTINGS.VIEW_DISTANCE/10f/2.15f);
            terrainNode.attachChild(geometryClipmapTerrain);
            
            geometryClipmapTerrain.setTranslation(startingX*J3DCore.CUBE_EDGE_SIZE, startingY*J3DCore.CUBE_EDGE_SIZE, startingZ*J3DCore.CUBE_EDGE_SIZE);
            
            geometryClipmapTerrain.setScale(J3DCore.CUBE_EDGE_SIZE, J3DCore.CUBE_EDGE_SIZE, J3DCore.CUBE_EDGE_SIZE);
            geometryClipmapTerrain.setRenderState(light);
	        geometryClipmapTerrain.setRenderState(core.fs_external);
        }
        else
        {
        
	        geometryClipmapTerrain = new GeometryClipmapTerrain(terrainCamera, heightmapPyramid, clipSideSize,
	                heightScale);
	        
	        terrainNode.attachChild(geometryClipmapTerrain);
	        geometryClipmapTerrain.setScale(J3DCore.CUBE_EDGE_SIZE, J3DCore.CUBE_EDGE_SIZE, J3DCore.CUBE_EDGE_SIZE);
        
	        geometryClipmapTerrain.setRenderState(core.modelLoader.loadTextureStates(new String[]{"grass2.png"})[0]);
	        geometryClipmapTerrain.setRenderState(core.fs_external);
	        
        }
        core.getGroundParentNode().markDirty(DirtyType.RenderState);
        core.getGroundParentNode().updateGeometricState(0);
        //geometryClipmapTerrain.getSceneHints().setLightCombineMode(LightCombineMode.Off);
        //heightmapPyramid.setDoWrap(false);
        
	}
	
	
	boolean updateNeeded = false;
	
	World w = null;
	
	public void addItem(NodePlaceholder place)
	{
		
		if (true) return;
		
	}
	
	public void update(double tpf)
	{
		if (terrainCamera!=null)
			terrainCamera.set(core.getCamera());
	}

	public void switchRendering(boolean state)
	{
		if (terrainNode!=null)
			terrainNode.getSceneHints().setCullHint(state?CullHint.Never:CullHint.Always);
	}
}
