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

import java.io.File;
import java.util.ArrayList;
import java.util.HashMap;

import org.jcrpg.threed.J3DCore;
import org.jcrpg.threed.NodePlaceholder;
import org.jcrpg.threed.engine.geometryinstancing.GeometryBatchInstanceAttributes;
import org.jcrpg.threed.engine.geometryinstancing.GeometryBatchMesh;
import org.jcrpg.threed.engine.geometryinstancing.GeometryBatchSpatialInstance;
import org.jcrpg.threed.scene.model.Model;

import com.ardor3d.bounding.BoundingBox;
import com.ardor3d.math.Matrix3;
import com.ardor3d.math.Quaternion;
import com.ardor3d.math.Vector3;
import com.ardor3d.math.type.ReadOnlyVector3;
import com.ardor3d.renderer.Camera;
import com.ardor3d.renderer.Renderer;
import com.ardor3d.renderer.state.FragmentProgramState;
import com.ardor3d.renderer.state.GLSLShaderObjectsState;
import com.ardor3d.renderer.state.RenderState;
import com.ardor3d.renderer.state.VertexProgramState;
import com.ardor3d.renderer.state.RenderState.StateType;
import com.ardor3d.scenegraph.Mesh;
import com.ardor3d.scenegraph.Node;
import com.ardor3d.scenegraph.hint.LightCombineMode;

/**
 * Trimesh GeomBatch mesh, especially for grass / tree foliage and such things - it uses vertex shader for wind animation,
 * and adds an own billboarding of the textured planes. (check onDraw)
 * @author illes
 *
 */
public class TrimeshGeometryBatch extends GeometryBatchMesh<GeometryBatchSpatialInstance<GeometryBatchInstanceAttributes>> {

	private static final long serialVersionUID = 0L;
	
	public Model model;
	public String key;
	
	public J3DCore core;
	public Node parent = new Node();
	/**
	 * Tells average of the translations of the instances.
	 */
	public Vector3 avarageTranslation = null;
	/**
	 * Set this on putting on scene if horizontal rotation is needed. Used in onDraw billboarding.
	 */
	public Quaternion horizontalRotation = null;
	
	public boolean animated = false;
	
	
	public Mesh nullmesh = new Mesh();
	String shaderDirectory = "../media/shaders/";
	String shaderName = "bbGrass";

	/*private GLSLShaderObjectsState createShader(String shaderDirectory, String shaderName) {

		DisplaySystem display = DisplaySystem.getDisplaySystem();
		
		GLSLShaderObjectsState shader;		
		shader = display.getRenderer().createGLSLShaderObjectsState();
		try {
			/*shader.load(getClass().getClassLoader().getResource(shaderDirectory + shaderName + ".vert"),
				 		getClass().getClassLoader().getResource(shaderDirectory + shaderName + ".frag"));* /
			shader.load(new File(shaderDirectory + shaderName + ".vert").toURI().toURL(),
						new File(shaderDirectory + shaderName + ".frag").toURI().toURL());
			
		} catch (Exception e) {
		}
		shader.setEnabled(true);
		return shader;
	}*/
	static GLSLShaderObjectsState gl = null;
	static VertexProgramState vp = null;
	FragmentProgramState fp = null;
	
	boolean vertexShader = false;
	public static HashMap<String,Node> sharedParentCache = new HashMap<String, Node>();
	
	float startFog;
	
	static int instanceCounter = 0;
	static int idCounter = 0;
	public TrimeshGeometryBatch(String id, J3DCore core, Mesh trimesh, boolean internal, NodePlaceholder placeHolder) {
		super("TrimeshGeometryBatch "+id+" "+placeHolder.model.id+" "+(idCounter++));
		this.core = core;
		//getMeshData().setIsCollidable(false);
		Node parentOrig = null;//sharedParentCache.get(id+internal);
		if (parentOrig==null)
		{
			parentOrig = new Node("TGB"+instanceCounter++);
			parentOrig.setRenderState(trimesh.getLocalRenderState(RenderState.StateType.Texture));
			parentOrig.setRenderState(trimesh.getLocalRenderState(RenderState.StateType.Material));
			parentOrig.setRenderState(trimesh.getLocalRenderState(RenderState.StateType.Light));
			if (!internal) parentOrig.getSceneHints().setLightCombineMode(LightCombineMode.Off);
			//sharedParentCache.put(id+internal,parentOrig);
		}
		this.getSceneHints().setLightCombineMode(LightCombineMode.Off);
		parent = parentOrig;//new SharedNode("sTriGB_"+(instanceCounter++)+"_"+parentOrig.getName(),parentOrig);
		parent.setTranslation(placeHolder.getLocalTranslation());
		parent.attachChild(this);
		parent.updateGeometricState(0);
		this.setModelBound(new BoundingBox());
		synchronized (J3DCore.hmSolidColorSpatials)
		{
			if (!internal) J3DCore.hmSolidColorSpatials.put(parent, parent);
		}
		
		vertexShader = (J3DCore.SETTINGS.ANIMATED_GRASS||J3DCore.SETTINGS.ANIMATED_TREES) && !internal;

	       if (vertexShader && vp==null)
	        { 
	        	vp = new VertexProgramState();
	            try {vp.load(new File(
	                    "../media/shaders/bbGrass2.vp").toURI().toURL());} catch (Exception ex){ex.printStackTrace();}
	            vp.setEnabled(true);
	            /*try {
		            if (!vp.isSupported())
		            {
		            	if (J3DCore.LOGGING()) Jcrpg.LOGGER.warning("!!!!!!! NO VP !!!!!!!");
		            }
	            } catch (Exception ex)
	            {
	            	vp = null;
	            }*/
	        }
	        if (vertexShader && fp==null)
	        {
	        	fp = new FragmentProgramState();
	            try {fp.load(new File(
	                    "../media/shaders/bbGrass2.fp").toURI().toURL());} catch (Exception ex){ex.printStackTrace();}
	            fp.setEnabled(true);
	            /*try {
		            if (!fp.isSupported())
		            {
		            	if (J3DCore.LOGGING()) Jcrpg.LOGGER.warning("!!!!!!! NO FP !!!!!!!");
		            }
	            } catch (Exception ex)
	            {
	            	fp = null;
	            }*/
	            
	        }
	        if (vertexShader && fp!=null) {
	        	this.setRenderState(core.fs_external);
	        	this.setRenderState(vp);
	        	this.setRenderState(fp);
	        }
			if (vertexShader && vp!=null && fp!=null) {
				if (!internal) {
					fp.setParameter(new float[]{core.fs_external.getColor().getRed(),core.fs_external.getColor().getGreen(),core.fs_external.getColor().getBlue(),core.fs_external.getColor().getAlpha()}, 0);
				} else
				{
					fp.setParameter(new float[]{core.fs_internal.getColor().getRed(),core.fs_internal.getColor().getGreen(),core.fs_internal.getColor().getBlue(),core.fs_internal.getColor().getAlpha()}, 0);
				}
			}
       
        if (J3DCore.SETTINGS.FARVIEW_ENABLED && model!=null && model.type==Model.PARTLYBILLBOARDMODEL)
    	{
    		startFog = (2*J3DCore.SETTINGS.RENDER_DISTANCE_FARVIEW*2)/3;
    	} else
    	{
    		startFog = 2*J3DCore.SETTINGS.VIEW_DISTANCE/3;
    	}
	}
	
	/**
	 * Refreshes avarage translation with added node's translation.
	 * @param trans Vector3.
	 */
	private void calcAvarageTranslation(ReadOnlyVector3 trans)
	{
		if (avarageTranslation==null)
		{
			avarageTranslation = new Vector3(trans);
		}
		else
		{
			int num = getInstances().size();
			double x = avarageTranslation.getX()*num;
			double y = avarageTranslation.getY()*num;
			double z = avarageTranslation.getZ()*num;
			avarageTranslation.set((x+trans.getX())/(num+1), (y+trans.getY())/(num+1), (z+trans.getZ())/(num+1));
		}
	}
	public ArrayList<GeometryBatchSpatialInstance<GeometryBatchInstanceAttributes>> notVisible = new ArrayList<GeometryBatchSpatialInstance<GeometryBatchInstanceAttributes>>();
	public ArrayList<GeometryBatchSpatialInstance<GeometryBatchInstanceAttributes>> visible = new ArrayList<GeometryBatchSpatialInstance<GeometryBatchInstanceAttributes>>();
	
	public static long sumAddItemReal = 0;
	public void addItem(NodePlaceholder placeholder, Mesh trimesh)
	{
		addItem(placeholder, trimesh, false);
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

	boolean itemAdditionUpdate = false;
	
	public static Vector3 vNull = new Vector3();
	@SuppressWarnings("unchecked")
	public void addItem(NodePlaceholder placeholder, Mesh trimesh, boolean placeholderTranslationRelative)
	{
		updateNeeded = true;
		itemAdditionUpdate = true;
		Vector3 vec = new Vector3(trimesh.getTranslation());
		Vector3 vecOrig = vec;
		float scaleMultiplier = 1f;
		if (placeholderTranslationRelative)
		{
			trimesh.setTranslation(vNull);			
			scaleMultiplier = placeholder.model.genericScale;
			vec = vec.multiply(placeholder.localScale,null);
			if (placeholder.horizontalRotation!=null)
			{
				vec = placeholder.horizontalRotation.apply(vec, null);//multiplyLocal(vec.getX(), vec.getY(), vec.getZ(), 0d); //
			}
			vec.addLocal(placeholder.getLocalTranslation().subtract(parent.getTranslation(),null));
		} else
		{
			vec = vec.subtract(parent.getTranslation(),null);
		}
		
		if (notVisible.size()>0)
		{
			long t0 = System.currentTimeMillis();
			GeometryBatchSpatialInstance<GeometryBatchInstanceAttributes> instance = notVisible.iterator().next();
			instance.getAttributes().setTranslation(vec);
			instance.getAttributes().setRotation(new Matrix3(trimesh.getRotation()));
			instance.getAttributes().setWorldTransform(trimesh.getTransform());
			instance.getAttributes().setScale(trimesh.getScale().multiply(scaleMultiplier,null));
			instance.getAttributes().setVisible(true);
			instance.getAttributes().buildMatrices();
			
			if (placeholder!=null) {

				ArrayList<GeometryBatchSpatialInstance<GeometryBatchInstanceAttributes>> instances = (ArrayList<GeometryBatchSpatialInstance<GeometryBatchInstanceAttributes>>)placeholder.trimeshGeomBatchInstance;
				if (instances==null)
				{
					instances = new ArrayList<GeometryBatchSpatialInstance<GeometryBatchInstanceAttributes>>();
					placeholder.trimeshGeomBatchInstance = instances;
				}
				instances.add(instance);
			}

			calcAvarageTranslation(trimesh.getTranslation());
			notVisible.remove(instance);
			synchronized (visible)
			{
				visible.add(instance);
			}
			sumAddItemReal += System.currentTimeMillis()-t0;
			trimesh.setTranslation(vecOrig);
			return;
		}
			
		long t0 = System.currentTimeMillis();
		// Add a Trimesh instance (batch and attributes)
		GeometryBatchSpatialInstance<GeometryBatchInstanceAttributes> instance = new GeometryBatchSpatialInstance<GeometryBatchInstanceAttributes>(trimesh,
				 new GeometryBatchInstanceAttributes(this, trimesh));
		if (scaleMultiplier!=1f) instance.getAttributes().getScale().multiplyLocal(scaleMultiplier);
		addInstance(instance);
		instance.getAttributes().setTranslation(vec);
		instance.getAttributes().buildMatrices();
		
		if (placeholder!=null) {
			ArrayList<GeometryBatchSpatialInstance<GeometryBatchInstanceAttributes>> instances = (ArrayList<GeometryBatchSpatialInstance<GeometryBatchInstanceAttributes>>)placeholder.trimeshGeomBatchInstance;
			if (instances==null)
			{
				instances = new ArrayList<GeometryBatchSpatialInstance<GeometryBatchInstanceAttributes>>();
				placeholder.trimeshGeomBatchInstance = instances;
			}
			instances.add(instance);
		}
		sumAddItemReal += System.currentTimeMillis()-t0;
		
		long t1 = System.currentTimeMillis();
		calcAvarageTranslation(trimesh.getTranslation());
		sumAddItemReal += System.currentTimeMillis()-t1;
		synchronized (visible)
		{
			visible.add(instance);
		}
		trimesh.setTranslation(vecOrig);
		return;
	}
	@SuppressWarnings("unchecked")
	public void removeItem(NodePlaceholder placeholder)
	{
		ArrayList<GeometryBatchSpatialInstance<GeometryBatchInstanceAttributes>> instances = (ArrayList<GeometryBatchSpatialInstance<GeometryBatchInstanceAttributes>>)placeholder.trimeshGeomBatchInstance;
		if (instances!=null)
		{
			for (Object instance:instances)
			{
				GeometryBatchSpatialInstance<GeometryBatchInstanceAttributes> geoInstance = (GeometryBatchSpatialInstance<GeometryBatchInstanceAttributes>)instance;
				
				if (geoInstance!=null) {
					geoInstance.getAttributes().setVisible(false); // switching off visibility
					synchronized (visible)
					{
						visible.remove(geoInstance);
					}
					notVisible.add(geoInstance);
					/*if (visible.size()>0)
					{
						geoInstance.getAttributes().setTranslation(visible.iterator().next().getAttributes().getTranslation());
					}*/
				}
			}
		}
		placeholder.trimeshGeomBatchInstance = null;
	}
	
	
	// Animation, billboarding
	
	Vector3 lastLook, lastLeft, lastLoc;

	double diffs[] = new double[5];
	double newDiffs[] = new double[5];
	boolean windSwitch = true;
	Vector3 origTranslation = null;
	static long passedTime = 0;
	float timeCounter = 0;
	static long startTime = System.currentTimeMillis();
	public float windPower = 1.0f; 
	int whichDiff = -1;
	
	public static final float TIME_DIVIDER = 800;
	public static final long TIME_LIMIT = 0;
	Quaternion orient = new Quaternion();
	
	public static boolean passedTimeCalculated = false;
	public static Quaternion qZero = new Quaternion();
	Matrix3 o = new Matrix3();
	int lastMinute = 0;
	
	double lastTime = 0;
	
	@Override
	public void updateGeometricState(double time, boolean initiator) {
		// TODO Auto-generated method stub
		super.updateGeometricState(time, initiator);
		lastTime = time;
	}

	// The special onDraw that handles shader parameters and billboard rotation too.
	@Override
	public void onDraw(Renderer r) {
		if (visible.size()==0) return;
		boolean needsUpdate = true;//true;
		//if (System.currentTimeMillis()%8>1) 
		{
			Camera cam = core.getCamera();//ContextCamera();
			Vector3 look = cam.getDirection().negate(null);
			Vector3 left1 = cam.getLeft().negate(null);
			ReadOnlyVector3 loc = cam.getLocation();
			// calculating needsUpdate of rotation
			
			if (lastLeft!=null)
			{
				if (!itemAdditionUpdate && look.distanceSquared(lastLook)<=0.05f && left1.distanceSquared(lastLeft)<=0.05f && loc.distanceSquared(lastLoc)<=0.1f)
				{
					needsUpdate = false;
					
				} else
				{
				//	if ((parent.getLocks()&Node.LOCKED_MESH_DATA)>0) parent.unlockMeshes();
				}
				itemAdditionUpdate = false;
			} else
			{
				lastLoc = new Vector3();
				lastLook = new Vector3();
				lastLeft = new Vector3();
			}
			
			if (needsUpdate) {
				lastLoc.set(loc);
				lastLook.set(look);
				lastLeft.set(left1);
				
				
				o.fromAxes(left1, cam.getUp(), look);
				orient.fromAxes(left1, cam.getUp(), look);
	
				if (vertexShader && vp!=null && fp!=null) {
    				//boolean found = false;
					double dist = 9999d;
    				for (GeometryBatchSpatialInstance<GeometryBatchInstanceAttributes> i:visible)
    				{
						Vector3 pos = parent.getWorldTranslation().add(i.getAttributes().getTranslation(),null);
						double d = pos.distance(cam.getLocation()); 
						if (d<dist)
						{ 
							dist = d;
						}
    				}

					//float dist = parent.getWorldTranslation().add(avarageTranslation).distance(core.getCamera().getLocation());
					// TODO make a better dist calc -> take the closest instances translation!
					if (J3DCore.SETTINGS.FARVIEW_ENABLED) {
						fp.setParameter(new float[]{(float)(1.0f-( Math.max(0, dist-startFog)/(startFog) * 0.3f)),0,0,0}, 1); // TODO
					} else
					{
						//{-1/(END-START), END/(END-START), NOT USED, NOT USED};
						//fp.setParameter(new float[]{-1f/(40f-15f), 40f/(40f-15f),0f, 0 }, 1);
						fp.setParameter(new float[]{(float)(1.0f-( Math.max(0, dist-startFog)/(startFog) * 0.8f)),0,0,0}, 1);
					}
				}
				
				synchronized (visible)
				{
					// if no shadows, billboarding for tree quads are on, coz only 1 quad is used per foliage then.
					// if shadows on, more treequads with diff. angles are used, no billboarding needed.
					// ...
					if (!J3DCore.SETTINGS.SHADOWS || Model.PARTLYBILLBOARDMODEL!=model.type)
					{
						for (GeometryBatchSpatialInstance<GeometryBatchInstanceAttributes> geoInstance:visible)
						{
							geoInstance.getAttributes().setRotation(o);
							geoInstance.getAttributes().buildMatrices();
						}
					}
				}
				
			}
	
			
			if (vertexShader && vp!=null && fp!=null) {
				if (!internal) {
					fp.setParameter(new float[]{core.cLightingColor[0],core.cLightingColor[1],core.cLightingColor[2],core.fs_external.getColor().getAlpha()},0);
							//core.fs_external.getColor().r,core.fs_external.getColor().g,core.fs_external.getColor().b,core.fs_external.getColor().a}, 0);
				} else
				{
					fp.setParameter(new float[]{core.fs_internal.getColor().getRed(),core.fs_internal.getColor().getGreen(),core.fs_internal.getColor().getBlue(),core.fs_internal.getColor().getAlpha()}, 0);
				}
			}
		}
		
		if (!passedTimeCalculated) {
			passedTime += lastTime*1000;
			passedTimeCalculated = true;
		}
		
		boolean doGrassMove = false;
		if (animated) {
			doGrassMove = true;
		}
		double diff = 0;
		if (doGrassMove) {
			// creating 5 diffs to look random
			diff = 0.159f * Math.sin(((passedTime / TIME_DIVIDER) * windPower)) * windPower;
			newDiffs[0] = diff;
			diff = 0.159f * Math.sin((((passedTime + 500) / TIME_DIVIDER) * windPower * (0.5f)))
					* windPower;
			newDiffs[1] = diff;
			diff = 0.159f * Math.sin((((passedTime + 500) / TIME_DIVIDER) * windPower * (0.6f)))
					* windPower;
			newDiffs[2] = diff;
			diff = 0.159f * Math.sin((((passedTime + 1000) / TIME_DIVIDER) * windPower * (0.8f)))
					* windPower;
			newDiffs[3] = diff;
			diff = 0.159f * Math.sin((((passedTime + 2000) / TIME_DIVIDER) * windPower * (0.7f)))
					* windPower;
			newDiffs[4] = diff;
			diffs = newDiffs;
			if (whichDiff==-1) {
				whichDiff = 0;//HashUtil.mixPercentage((int)this.getWorldTranslation().x,(int)this.getWorldTranslation().y,(int)this.getWorldTranslation().z)%5;
			}
			
			if (vertexShader && fp!=null) {
	    		vp.setParameter(new float[]{(float)diffs[0],(float)diffs[0],0,0}, 0);
	    		vp.setParameter(new float[]{(float)diffs[1],(float)diffs[1],0,0}, 1);
	    		vp.setParameter(new float[]{(float)diffs[2],(float)diffs[2],0,0}, 2);
	    		vp.setParameter(new float[]{(float)diffs[3],(float)diffs[3],0,0}, 3);
	    		vp.setParameter(new float[]{(float)diffs[4],(float)diffs[4],0,0}, 4);

	    		ReadOnlyVector3 camLoc = core.getCamera().getLocation();
	    		vp.setParameter(new float[]{camLoc.getXf(),camLoc.getYf(),camLoc.getZf(),0}, 5);
			}
		}
		super.onDraw(r);
	}

	public boolean isAnimated() {
		return animated;
	}
	
	public boolean internal = false;

	public void setAnimated(boolean animated, boolean internal) {
		this.animated = animated;
		this.internal = internal;
		vertexShader=animated;
		if (animated)  {
			if (!internal) {
				this.setRenderState(core.fs_external);
			} else
			{
				this.setRenderState(core.fs_internal);
			}
        	this.setRenderState(vp);
        	this.setRenderState(fp);
		} else
		{
			if (!internal) {
				this.setRenderState(core.fs_external);
			} else
			{
				this.setRenderState(core.fs_internal);
			}
        	this.clearRenderState(StateType.VertexProgram);
        	this.clearRenderState(StateType.FragmentProgram);
		}
	}

	public void clearAll()
	{
		visible.clear();
		notVisible.clear();
	}

}