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

package org.jcrpg.threed.engine;

import java.util.ArrayList;
import java.util.HashMap;

import org.jcrpg.apps.Jcrpg;
import org.jcrpg.threed.J3DCore;
import org.jcrpg.threed.NodePlaceholder;
import org.jcrpg.threed.GeoTileLoader.TiledTerrainBlockAndPassNode;
import org.jcrpg.threed.engine.geometryinstancing.GeometryBatchInstanceAttributes;
import org.jcrpg.threed.engine.geometryinstancing.GeometryBatchMesh;
import org.jcrpg.threed.engine.geometryinstancing.GeometryBatchSpatialInstance;
import org.jcrpg.threed.engine.vegetation.BillboardPartVegetation;
import org.jcrpg.threed.scene.model.Model;
import org.jcrpg.threed.scene.model.PartlyBillboardModel;
import org.jcrpg.threed.scene.model.QuadModel;
import org.jcrpg.threed.scene.model.SimpleModel;

import com.ardor3d.image.Texture;
import com.ardor3d.math.Matrix3;
import com.ardor3d.math.Transform;
import com.ardor3d.math.Vector3;
import com.ardor3d.renderer.state.GLSLShaderObjectsState;
import com.ardor3d.renderer.state.RenderState;
import com.ardor3d.renderer.state.TextureState;
import com.ardor3d.renderer.state.RenderState.StateType;
import com.ardor3d.scenegraph.Mesh;
import com.ardor3d.scenegraph.Node;
import com.ardor3d.util.TextureManager;

/**
 * Model geometry batch that can hold together a lot of similar texture state trimeshes in one batch mesh
 * using GeometryBatchMesh.
 * @author illes
 *
 */
public class ModelGeometryBatch extends GeometryBatchMesh<GeometryBatchSpatialInstance<GeometryBatchInstanceAttributes>> {
	private static final long serialVersionUID = 0L;
	
	public Model model;
	public J3DCore core;
	public Node parent = new Node();
	public String key = null;
	
	public Mesh nullmesh = new Mesh();
	// TODO create a cache cleaning way!!! in GeometryBatchHelper maybe, check if the model is used at all...
	// till then it fastens up thing much, so keep it!
	public static HashMap<Object, Mesh> cache = new HashMap<Object, Mesh>();
	
	/**
	 * Returning the model's mesh for creating batchInstance copy of it.
	 * @param m
	 * @param n
	 * @return The trimesh to commit into the batch.
	 */
	private Mesh getModelMesh(Model m,NodePlaceholder n)
	{
		if (m.type == Model.QUADMODEL) {
			Mesh mesh = cache.get(m);
			if (cache.get(m)==null){
				mesh = (Mesh)core.modelLoader.loadQuadModelNode((QuadModel)m, false).getChild(0);
				cache.put(m, mesh);
			}
			return mesh; 	
		} else
		if (m.type == Model.SIMPLEMODEL)
		{
			if (((SimpleModel)m).generatedGroundModel)
			{
				System.out.println("THIS SHOULDNT RUN!!!");
				return nullmesh;
				//GeoTileLoader loader = core.modelLoader.geoTileLoader;
				//return loader.loadNodeOriginal(n);
			} else
			{
				Mesh mesh = cache.get(m);
				if (cache.get(m)==null){
					mesh = (Mesh)core.modelLoader.loadNodeOriginal((SimpleModel)m, false).getChild(0);
					cache.put(m, mesh);
				}
				return mesh;
			}
		} else
		{
			return nullmesh;
		}
	}
	
	private TiledTerrainBlockAndPassNode getTiledBlockData(Model m,NodePlaceholder n,boolean splatNodeNeeded)
	{
		return core.modelLoader.geoTileLoader.loadNodeOriginal(n,splatNodeNeeded);
	}

	public static HashMap<String,Node> sharedParentCache = new HashMap<String, Node>();

	/**
	 * Special constructor for use with billboard part vegetation node - the node will provide
	 * the trunk triMesh that is not foliage part - in constructor only used for texture state retrieval.
	 * @param core
	 * @param m
	 * @param placeHolder
	 * @param veg
	 */
	public ModelGeometryBatch(J3DCore core, Model m, NodePlaceholder placeHolder, BillboardPartVegetation veg) {
		super("ModelGeometryBatchBB "+m.id+" "+(idCounter++));
		model = m;
		this.core = core;
		Mesh mesh = null;
		TiledTerrainBlockAndPassNode data = null;
		// getting trunk mesh Mesh for geometryBatch's base mesh.
		mesh = ((Mesh)(((Node)veg.foliagelessModelSpatial).getChild(0)));
		// storing the billboard parent mesh for addItem use.
		
		String parentKey = m.getId(placeHolder);
		parentKey+= placeHolder.neighborCubeData==null?"":placeHolder.neighborCubeData.getTextureKeyPartForBatch();
		Node parentOrig = null;//sharedParentCache.get(parentKey);
		if (parentOrig==null)
		{
			if (data==null || data.passNode==null)
			{

				parentOrig = new Node();
				parentOrig.setRenderState(mesh.getLocalRenderState(StateType.Texture));
				if (m.type == Model.PARTLYBILLBOARDMODEL) {
					//parentOrig.setRenderState(quad.getLocalRenderState(RenderState.RS_MATERIAL));
					parentOrig.setRenderState(mesh.getLocalRenderState(StateType.Light));
					SimpleModel sm = (SimpleModel)m;
					TextureState ts = (TextureState)mesh.getLocalRenderState(RenderState.StateType.Texture);

					if (J3DCore.SETTINGS.NORMALMAP_ENABLED)
					{
						if (sm.normalMapTexture!=null)
						{
							if (ts.getNumberOfSetTextures()==1) 
							{
								if (so==null) reloadShader();
						        // Normal map
						        Texture normalMap = TextureManager.load( sm.normalMapTexture,
						        		//"Pillar_Nor.png",
						                Texture.MinificationFilter.Trilinear, 
						                  true);
						        normalMap.setWrap(Texture.WrapMode.Repeat);
						        ts.setTexture(normalMap, 1);
						        
						        // Spec Map
						        if (sm.specMapTexture!=null)
						        {
							        Texture specMap = TextureManager.load( sm.specMapTexture,
							        		//"Pillar_Spec.png",
					                Texture.MinificationFilter.Trilinear, 
					                  true);
					        		specMap.setWrap(Texture.WrapMode.Repeat);
					        		ts.setTexture(specMap, 2);
						        }
						        if (sm.heightMapTexture!=null)
						        {
							        Texture heightMap = TextureManager.load( sm.heightMapTexture,
							        		//"Pillar_Spec.png",
					                Texture.MinificationFilter.Trilinear, 
					                  true);
					        		heightMap.setWrap(Texture.WrapMode.Repeat);
					        		ts.setTexture(heightMap, 3);
						        }
							}
							{
				        		if (placeHolder.cube.cube.internalCube)
				        		{
				        			parentOrig.setRenderState(so_point);
				        		} else
				        		{
				        			parentOrig.setRenderState(so);
				        		}
							}
							parentOrig.setRenderState(J3DCore.ms);
						}
					}
				}
				
				//sharedParentCache.put(parentKey,parentOrig);
			} else
			{
				System.out.println("PASSNODE...");
				parentOrig = new Node();
				//parentOrig = data.passNode;//.attachChild(parentOrig);
				parentOrig.attachChild(data.passNode);
				this.getMeshData().copyTextureCoordinates(0, 1, 1);
				data.passNode.attachChild(this);
				//parentOrig.setRenderState(data.passNode.getLocalRenderState(RenderState.RS_TEXTURE));
				if (m.type == Model.SIMPLEMODEL) {
					//parentOrig.setRenderState(quad.getLocalRenderState(RenderState.RS_MATERIAL));
					//parentOrig.setRenderState(mesh.getLocalRenderState(RenderState.RS_LIGHT));
				}
				//sharedParentCache.put(parentKey,parentOrig);
			}
		}
		if (data==null || data.passNode==null)
		{
			parent = parentOrig;//new SharedNode("s"+parentOrig.getName(),parentOrig);
			parent.setTranslation(placeHolder.getLocalTranslation());
			parent.attachChild(this);
		} else
		{
			parent = parentOrig;
		}
		
	}
    static private GLSLShaderObjectsState so;
    static private GLSLShaderObjectsState so_point;
    private String currentShaderStr = "org/jcrpg/threed/jme/effects/shader/normalmap/parallax";//parallax";

   public void reloadShader() {
		GLSLShaderObjectsState testShader = new GLSLShaderObjectsState();
		/*try {
			testShader.setF.load(ModelGeometryBatch.class.getClassLoader()
					.getResource(currentShaderStr + ".vert"),
					ModelGeometryBatch.class.getClassLoader().getResource(
							currentShaderStr + ".frag"));
			testShader.apply();
			DisplaySystem.getDisplaySystem().getRenderer().checkCardError();
		} catch (JmeException e) {
			Jcrpg.LOGGER.log(Level.WARNING, "Failed to reload shader", e);
			e.printStackTrace();
			return;
		} TODO ardor3d */
		if (so == null) {
			so = new GLSLShaderObjectsState();

			// Check is GLSL is supported on current hardware.
			/*if (!GLSLShaderObjectsState.isSupported()) {
				Jcrpg.LOGGER
						.severe("Your graphics card does not support GLSL programs, and thus cannot run this test.");
				return;
			}*/
		}
		if (so_point == null) {
			so_point = new GLSLShaderObjectsState();

			// Check is GLSL is supported on current hardware.
			/*if (!GLSLShaderObjectsState.isSupported()) {
				Jcrpg.LOGGER
						.severe("Your graphics card does not support GLSL programs, and thus cannot run this test.");
				return;
			}*/
		}
		try
		{
			if (J3DCore.SETTINGS.NORMALMAP_DETAILED)
			{
				
				so.setVertexShader(ModelGeometryBatch.class.getClassLoader().getResource(
						currentShaderStr + "2.vert").openStream());
				so.setFragmentShader(ModelGeometryBatch.class.getClassLoader().getResource(
						currentShaderStr + "2.frag").openStream());
				
				so_point.setVertexShader(ModelGeometryBatch.class.getClassLoader().getResource(
						currentShaderStr + "2.vert").openStream());
				so_point.setFragmentShader(ModelGeometryBatch.class.getClassLoader().getResource(
						currentShaderStr + "2.frag").openStream());
				
			} else
			{
	
				so.setVertexShader(ModelGeometryBatch.class.getClassLoader().getResource(
						currentShaderStr + "2.vert").openStream());
				so.setFragmentShader(ModelGeometryBatch.class.getClassLoader().getResource(
						currentShaderStr + "2.frag").openStream());
				
				so_point.setVertexShader(ModelGeometryBatch.class.getClassLoader().getResource(
						currentShaderStr + "_pointlight.vert").openStream());
				so_point.setFragmentShader(ModelGeometryBatch.class.getClassLoader().getResource(
						currentShaderStr + "_pointlight.frag").openStream());
			}
		} catch (Exception ex)
		{
			ex.printStackTrace();
		}
		so.setUniform("baseMap", 0);
		so.setUniform("normalMap", 1);
		so.setUniform("specularMap", 2);
		so.setUniform("heightMap", 3);
		so.setUniform("heightValue", 0.005f);
		so.setEnabled(true);

		so_point.setUniform("baseMap", 0);
		so_point.setUniform("normalMap", 1);
		so_point.setUniform("specularMap", 2);
		so_point.setUniform("heightMap", 3);
		so_point.setUniform("heightValue", 0.02f);
		so_point.setEnabled(true);
		
		Jcrpg.LOGGER.info("Shader reloaded...");
	}
   
   static int idCounter = 0;
   
   static int pendingModelLoadingThreads = 0;
   
	/**
	 * 
	 * @param core
	 * @param m The initial model for which we initialize it.
	 * @param placeHolder Initial placeholder.
	 */
	public ModelGeometryBatch(J3DCore core, Model m, NodePlaceholder placeHolder) {
		super("ModelGeometryBatch "+m.id+" "+(idCounter++));
		model = m;
		this.core = core;
		Mesh mesh = null;
		TiledTerrainBlockAndPassNode data = null;
		String nMap = null, hMap = null, sMap = null;
		if (m.type == Model.SIMPLEMODEL && ((SimpleModel)m).generatedGroundModel)
		{
			data = getTiledBlockData(m,placeHolder,true);
			mesh = data.block;
			hMap = data.heightMap;
			nMap = data.normalMap;
			sMap = data.specMap;
			this.setRenderState(core.cs_back);
		} else
		{
			mesh = getModelMesh(m,placeHolder);
		}
		 

		String parentKey = m.getId(placeHolder);
		parentKey+= placeHolder.neighborCubeData==null?"":placeHolder.neighborCubeData.getTextureKeyPartForBatch();
		Node parentOrig = null;//sharedParentCache.get(parentKey);
		if (parentOrig==null)
		{
			if (data==null || data.passNode==null)
			{
				parentOrig = new Node("MGB"+instanceCounter++);
				TextureState ts = (TextureState)mesh.getLocalRenderState(RenderState.StateType.Texture);
				parentOrig.setRenderState(ts);
				
				if (m.type == Model.SIMPLEMODEL) {
					//parentOrig.setRenderState(quad.getLocalRenderState(RenderState.RS_MATERIAL));
					parentOrig.setRenderState(mesh.getLocalRenderState(RenderState.StateType.Texture));
					SimpleModel sm = (SimpleModel)m;
					if (J3DCore.SETTINGS.NORMALMAP_ENABLED)
					{
						if (nMap==null)
						{
							nMap = sm.normalMapTexture;
							hMap = sm.heightMapTexture;
							sMap = sm.specMapTexture;
						}
						if (nMap!=null)
						{
							if (ts.getNumberOfSetTextures()==1) 
							{
								if (so==null) reloadShader();
						        // Normal map
						        Texture normalMap = TextureManager.load( nMap,
						        		//"Pillar_Nor.png",
						                Texture.MinificationFilter.Trilinear, 
						                 true);
						        normalMap.setWrap(Texture.WrapMode.Repeat);
						        ts.setTexture(normalMap, 1);
						        
						        // Spec Map
						        if (sm.specMapTexture!=null)
						        {
							        Texture specMap = TextureManager.load( sMap,
							        		//"Pillar_Spec.png",
					                Texture.MinificationFilter.Trilinear, 
					                 true);
					        		specMap.setWrap(Texture.WrapMode.Repeat);
					        		ts.setTexture(specMap, 2);
						        }
						        if (sm.heightMapTexture!=null)
						        {
							        Texture heightMap = TextureManager.load( hMap,
							        		//"Pillar_Spec.png",
					                Texture.MinificationFilter.Trilinear, 
					                 true);
					        		heightMap.setWrap(Texture.WrapMode.Repeat);
					        		ts.setTexture(heightMap, 3);
						        }
							}
							{
				        		if (placeHolder.cube.cube.internalCube)
				        		{
				        			parentOrig.setRenderState(so_point);
				        		} else
				        		{
				        			parentOrig.setRenderState(so);
				        		}
							}
							parentOrig.setRenderState(J3DCore.ms);
						}
					}
				}
				//sharedParentCache.put(parentKey,parentOrig);
			} else
			{
				System.out.println("PASSNODE...");
				parentOrig = new Node("MGB"+instanceCounter++);
				//parentOrig = data.passNode;//.attachChild(parentOrig);
				parentOrig.attachChild(data.passNode);
				this.getMeshData().copyTextureCoordinates(0, 1, 1);
				data.passNode.attachChild(this);
				//parentOrig.setRenderState(data.passNode.getLocalRenderState(RenderState.RS_TEXTURE));
				if (m.type == Model.SIMPLEMODEL) {
					//parentOrig.setRenderState(quad.getLocalRenderState(RenderState.RS_MATERIAL));
					//parentOrig.setRenderState(mesh.getLocalRenderState(RenderState.RS_LIGHT));
				}
				//sharedParentCache.put(parentKey,parentOrig);
			}
		}
		if (data==null || data.passNode==null)
		{
			parent = parentOrig;//new SharedNode("sMGB_"+(instanceCounter++)+"_"+parentOrig.getName(),parentOrig);
			parent.setTranslation(placeHolder.getLocalTranslation());
			parent.attachChild(this);
		} else
		{
			parent = parentOrig;
		}
		//setVBOInfo(new VBOInfo(true));
	}
	static int instanceCounter = 0;
	
	/**
	 * Returns a unique key for the model type so that reuse of batchInstances in nonVisible list can work.
	 * @param place
	 * @return
	 */
	public String getModelKey(NodePlaceholder place)
	{
		String key = "-";
		if (model.type == Model.SIMPLEMODEL) 
		{
			if (((SimpleModel)place.model).getTexture(place)!=null) 
			{
				
				key = ((SimpleModel)place.model).getId(place)+((SimpleModel)model).generatedGroundModel+  ( ((SimpleModel)model).generatedGroundModel? (place.cube.cube.cornerHeights!=null?place.cube.cube.cornerHeights.hashCode():"___") : "");
			} else
			{
				key = ((SimpleModel)place.model).getId(place);
			}
		}
		else if (model.type == Model.PARTLYBILLBOARDMODEL)
		{
			key = ((SimpleModel)place.model).getId(place);
		}
		else
		{
		}
		return key;
		
	}
	public static long sumBuildMatricesTime = 0;
	public void addItem(NodePlaceholder placeholder)
	{
		addItem(placeholder, null);
	}
	
	public boolean updateNeeded = false;
	public boolean isUpdateNeededAndSwitchIt()
	{
		if (updateNeeded)
		{
			updateNeeded = false;
			return true;
		}
		return false;
	}
	
	/**
	 * Adding a new item to the geomBatch parametered by the placeholder.
	 * @param placeholder
	 * @param Mesh sub Mesh - means a multi Mesh model display, using multiple visibleSets/nonVisible sets.
	 * Nodeplaceholder multiBatchinstance will be initialized and filled with the for-mesh-created batchInstance .
	 */
	public void addItem(NodePlaceholder placeholder,Mesh triMesh)
	{
		updateNeeded = true;
		String key = getModelKey(placeholder)+(triMesh!=null?triMesh.getName():"");
		ArrayList<GeometryBatchSpatialInstance<GeometryBatchInstanceAttributes>> nVSet = notVisible.get(key);
		ArrayList<GeometryBatchSpatialInstance<GeometryBatchInstanceAttributes>> vSet = visible.get(key);
		if (vSet==null)
		{
			vSet = new ArrayList<GeometryBatchSpatialInstance<GeometryBatchInstanceAttributes>>();
			visible.put(key, vSet);
		}
		if (nVSet!=null && nVSet.size()>0)
		{
			long t0 = System.currentTimeMillis();
			GeometryBatchSpatialInstance<GeometryBatchInstanceAttributes> instance = nVSet.iterator().next();
			//instance.getAttributes().setTranslation(placeholder.getLocalTranslation().subtract(parent.getTranslation(),null));
			instance.getAttributes().setTranslation(placeholder.getLocalTranslation().clone());
			if (!(placeholder.model instanceof SimpleModel) || placeholder.model instanceof SimpleModel && !((SimpleModel)placeholder.model).generatedGroundModel)
			{
				// TODO ardor3d! 
				Transform t = new Transform();
				t.setRotation(placeholder.getLocalRotation());
				instance.getAttributes().setRotation(new Matrix3(t.getMatrix()));
				
				//instance.getAttributes().setRotation(placeholder.getLocalRotation());
			} else
			{
				instance.getAttributes().getTranslation().addLocal(new Vector3(-1f,0,-1f));
			}

			sumBuildMatricesTime+=System.currentTimeMillis()-t0;
			if (placeholder.farView)
			{
				Vector3 scale = new Vector3(placeholder.getLocalScale());
				instance.getAttributes().setScale(scale.multiply(J3DCore.WORLD_SCALE,null));
			} else
			{
				instance.getAttributes().setScale(placeholder.getLocalScale().multiply(J3DCore.WORLD_SCALE, null));
			}
			//instance.getAttributes().setTransformed(placeholder.getTransform());

			// TODO add randomization here!
			// call instance special function that modifies coordinates slightly based on coordinates / placement
			if (placeholder.model instanceof PartlyBillboardModel)
			{
				instance.setSeed(true, placeholder.cube.cube.x+placeholder.cube.cube.y+placeholder.cube.cube.z);
			} else
			{
				instance.setSeed(false, 0);
			}

			instance.getAttributes().setVisible(true);
			instance.getAttributes().buildMatrices();
			if (triMesh!=null)
			{
				// multi batch instance needed
				if (placeholder.multiBatchInstance==null) placeholder.multiBatchInstance = new HashMap<String, Object>();
				placeholder.multiBatchInstance.put(key, instance);
			}
			placeholder.modelGeomBatchInstance = instance;
			nVSet.remove(instance);
			vSet.add(instance);
			return;
		} else
		{
			long t0 = System.currentTimeMillis();
			Mesh meshData = null;
			TiledTerrainBlockAndPassNode data = null;
			if (placeholder.model.type == Model.SIMPLEMODEL && ((SimpleModel)placeholder.model).generatedGroundModel)
			{
				data = getTiledBlockData(placeholder.model,placeholder,false);
				meshData = data.block;
			} else
			if (placeholder.model.type == Model.PARTLYBILLBOARDMODEL)
			{
				meshData = triMesh;//
			} else
			{
				meshData = getModelMesh(placeholder.model,placeholder);
			}
			
			//if (J3DCore.LOGGING()) Jcrpg.LOGGER.finest("ADDING"+placeholder.model.id+quad.getName());
			meshData.setTranslation(placeholder.getLocalTranslation().clone());//.subtract(parent.getTranslation(),null));
			//quad.setLocalTranslation(placeholder.getLocalTranslation());
			//quad.setDefaultColor(new ColorRGBA(1.0f, 1.0f, 1.0f, 1.0f));
			if (!(placeholder.model instanceof SimpleModel) || placeholder.model instanceof SimpleModel && !((SimpleModel)placeholder.model).generatedGroundModel)
			{
				meshData.setRotation(placeholder.getLocalRotation().clone());
			} else
			{
				// TODO generate ground wrongly positioned/rotated...
				meshData.setTranslation(meshData.getTranslation().add(new Vector3(-1f,0,-1f),null));
			}
			
			
			if (placeholder.farView)
			{
				Vector3 scale = new Vector3(placeholder.getLocalScale());
				meshData.setScale(scale.multiply(J3DCore.WORLD_SCALE,null));
			} else
			{
				meshData.setScale(placeholder.getLocalScale().multiply(J3DCore.WORLD_SCALE,null));
			}
			
			// Add a Box instance (batch and attributes)
			GeometryBatchSpatialInstance<GeometryBatchInstanceAttributes> instance = new GeometryBatchSpatialInstance<GeometryBatchInstanceAttributes>(meshData, 
					 new GeometryBatchInstanceAttributes(this, meshData));
			
			if (placeholder.model instanceof PartlyBillboardModel)
			{
				instance.setSeed(true, placeholder.cube.cube.x+placeholder.cube.cube.y+placeholder.cube.cube.z);
			} 
			
			// TODO add randomization here!
			// call instance special function that modifies coordinates slightly based on coordinates / placement
			
			
			if (triMesh!=null)
			{
				// multi batch instance needed
				if (placeholder.multiBatchInstance==null) placeholder.multiBatchInstance = new HashMap<String, Object>();
				placeholder.multiBatchInstance.put(key, instance);
			}
			placeholder.modelGeomBatchInstance = instance;
			//System.out.println("--- "+key);
			addInstance(instance);
			vSet.add(instance);
			sumBuildMatricesTime+=System.currentTimeMillis()-t0;
		}
			
	}
	
	public HashMap<String, ArrayList<GeometryBatchSpatialInstance<GeometryBatchInstanceAttributes>>> notVisible = new HashMap<String, ArrayList<GeometryBatchSpatialInstance<GeometryBatchInstanceAttributes>>>();
	public HashMap<String, ArrayList<GeometryBatchSpatialInstance<GeometryBatchInstanceAttributes>>> visible = new HashMap<String, ArrayList<GeometryBatchSpatialInstance<GeometryBatchInstanceAttributes>>>();
	
	public void removeItem(NodePlaceholder placeholder)
	{
		removeItem(placeholder, null);
	}
	/**
	 * 
	 * @param placeholder
	 * @param Mesh If specified it means a model with multiple batch instances is displayed with
	 * multiple keys based on Mesh name. Removal will be executed with the sub triMesh's batchInstance
	 */
	@SuppressWarnings("unchecked")
	public void removeItem(NodePlaceholder placeholder,Mesh triMesh)
	{
		
		GeometryBatchSpatialInstance<GeometryBatchInstanceAttributes> instance = (GeometryBatchSpatialInstance<GeometryBatchInstanceAttributes>)placeholder.modelGeomBatchInstance; 
		String key = getModelKey(placeholder)+(triMesh!=null?triMesh.getName():"");
		if (triMesh!=null)
		{
			// multi batch instance needed
			if (placeholder.multiBatchInstance==null) return;
			instance = (GeometryBatchSpatialInstance<GeometryBatchInstanceAttributes>)placeholder.multiBatchInstance.get(key);
		}
		if (instance!=null) {
			instance.getAttributes().setVisible(false);
			ArrayList<GeometryBatchSpatialInstance<GeometryBatchInstanceAttributes>> nVSet = notVisible.get(key);
			ArrayList<GeometryBatchSpatialInstance<GeometryBatchInstanceAttributes>> vSet = visible.get(key);
			if (nVSet==null)
			{
				nVSet = new ArrayList<GeometryBatchSpatialInstance<GeometryBatchInstanceAttributes>>();
				notVisible.put(key, nVSet);
			}
			if (vSet!=null) {
				vSet.remove(instance);
				if (vSet.size()==0)
				{
					visible.remove(key);
				}
			}
			nVSet.add(instance);
			/*if (visible.size()>0)
			{
				instance.getAttributes().setTranslation(visible.iterator().next().getAttributes().getTranslation());
			}*/
			
			if (triMesh!=null) 
			{
				// if Mesh based detailed model we use multiBatchInstance map
				placeholder.multiBatchInstance.remove(key);
//				removeInstance((GeometryBatchSpatialInstance<GeometryBatchInstanceAttributes>)placeholder.multiBatchInstance.get(key));
				
			} else
			{
				//removeInstance((GeometryBatchSpatialInstance<GeometryBatchInstanceAttributes>)placeholder.modelGeomBatchInstance);
			}
			placeholder.modelGeomBatchInstance = null;
		}
	}
	
	public void clearAll()
	{
		visible.clear();
		notVisible.clear();
	}
	
	
}