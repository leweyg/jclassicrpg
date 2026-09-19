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
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;

import org.jcrpg.threed.J3DCore;
import org.jcrpg.threed.NodePlaceholder;
import org.jcrpg.threed.PooledNode;
import org.jcrpg.threed.PooledSharedNode;
import org.jcrpg.threed.ModelPool.PoolItemContainer;
import org.jcrpg.threed.engine.TrimeshGeometryBatch;
import org.jcrpg.threed.scene.model.PartlyBillboardModel;
import org.jcrpg.util.HashUtil;

import com.ardor3d.bounding.BoundingBox;
import com.ardor3d.image.Texture;
import com.ardor3d.image.Texture.CombinerScale;
import com.ardor3d.math.ColorRGBA;
import com.ardor3d.math.FastMath;
import com.ardor3d.math.Matrix3;
import com.ardor3d.math.Quaternion;
import com.ardor3d.math.Vector3;
import com.ardor3d.renderer.Camera;
import com.ardor3d.renderer.Renderer;
import com.ardor3d.renderer.state.TextureState;
import com.ardor3d.scenegraph.Mesh;
import com.ardor3d.scenegraph.Node;
import com.ardor3d.scenegraph.Spatial;
import com.ardor3d.scenegraph.hint.LightCombineMode;
import com.ardor3d.scenegraph.shape.Quad;

/**
 * Partly billboard vegetation handler node. 
 * Removes model specified trimesh batch and replaces it with billboarded quads.
 * @author pali
 */
public class BillboardPartVegetation extends Node implements PooledNode {

	boolean NO_BATCH_GEOMETRY = false;

	public org.jcrpg.threed.ModelPool.PoolItemContainer cont;

	public PoolItemContainer getPooledContainer() {
		return cont;
	}

	public void setPooledContainer(PoolItemContainer cont) {
		this.cont = cont;
	}
	
	public PartlyBillboardModel model;
	public static HashMap<String, Quad> quadCache = new HashMap<String, Quad>();
	
	/**
	 * 
	 */
	private static final long serialVersionUID = 2149957857609187916L;
	
	public J3DCore core;
	public Camera cam;
	public float viewDistance;
	private Vector3 tmpVec = new Vector3();
	
	public TrimeshGeometryBatch batch;
	
	boolean horRotated = false;
	boolean internal = false;
	
	public BillboardPartVegetation(J3DCore core, Camera cam, float viewDistance, PartlyBillboardModel model, boolean horRotated, boolean internal) {
		System.out.println("BillbPV "+horRotated+" I: "+internal+" "+model.modelName+" "+model.id);
		this.core = core;
		this.cam = cam;
		this.viewDistance = viewDistance;
		this.model = model;
		this.horRotated = horRotated;
		this.internal = internal;
		
	}
	
	public class QuadParams
	{
		public String name;
		public TextureState[] states;
		public String key; 
		public float xSize, ySize, x, y, z;
		public QuadParams(String name, TextureState[] states, String key, float xSize, float ySize, float x, float y,
				float z) {
			super();
			this.name = name;
			this.states = states;
			this.key = key;
			this.xSize = xSize;
			this.ySize = ySize;
			this.x = x;
			this.y = y;
			this.z = z;
		}
		
	}
	
	public HashSet<QuadParams> quads = new HashSet<QuadParams>();
	public HashSet<Mesh> quadMeshes = new HashSet<Mesh>();
	
	public void fillBillboardQuadsRotated(boolean rotated)
	{
		if (NO_BATCH_GEOMETRY)
		{
			for (Mesh mesh:quadMeshes)
			{
				mesh.removeFromParent();
			}
		} else
		{
			if (this.getParent()!=null) {
				this.getParent().removeFromParent();
				if (batch!=null)
				{
					batch.parent.removeFromParent();
				}
				batch = null;
				this.detachAllChildren();
			}
		}
		for (QuadParams quadParams: quads)
		{
			Mesh mesh = createQuad(rotated, quadParams.name, quadParams.states, quadParams.key, quadParams.xSize, quadParams.ySize, quadParams.x, quadParams.y, quadParams.z);
			if (NO_BATCH_GEOMETRY) 
			{
				mesh.setName("---");
				this.attachChild(mesh);
			}
		}
		/*if (!NO_BATCH_GEOMETRY) {
			this.attachChild(batch.parent);
			//batch.setModelBound(modelBound)
			batch.parent.updateModelBound();
			batch.parent.updateWorldBound();
			batch.parent.getWorldRotation().set(new Quaternion());
			batch.parent.setLocalRotation(new Quaternion());
			batch.getWorldRotation().set(new Quaternion());
			batch.setLocalRotation(new Quaternion());
		}*/
	}
	
	public Quad targetQuad = null;
	/**
	 * Transforming the model's trimesh batchs to quads.
	 * @param child
	 */
	public void transformTrimeshesToQuads(Spatial child) {
		//System.out.println("TRANSFORMATION..."+child);
		// get down to the batchtri children, remove them and replace
		// double tris with new quads, based on the average x/y/z coords of the
		// 4 vertices of the two triangle of one original leaf!

		// billboard world rotation calc
		Vector3 look = cam.getDirection().negate(null);
		// coopt loc for our left direction:
		Vector3 left1 = cam.getLeft().negate(null);
		Quaternion orient = new Quaternion();
		orient.fromAxes(left1, cam.getUp(), look);
		Matrix3 orient1 = new Matrix3();
		orient1.fromAxes(left1, cam.getUp(), look);
		
		int added = 0;
		HashSet<Mesh> removed = new HashSet<Mesh>();
		TextureState[] states = null;
		if (model.atlasTexture)
		{
			states = core.modelLoader.loadTextureStates(new String[]{model.atlasTextureName});
		} else
		{
			states = core.modelLoader.loadTextureStates(model.billboardPartTextures);
		}
		for (int i=0; i<states.length; i++) {
			Texture t1 = states[i].getTexture();
			t1.setApply(Texture.ApplyMode.Modulate);
			t1.setCombineFuncRGB(Texture.CombinerFunctionRGB.Modulate);
			t1.setCombineSrc0RGB(Texture.CombinerSource.TextureUnit0);
			t1.setCombineOp0RGB(Texture.CombinerOperandRGB.OneMinusSourceColor);
			t1.setCombineSrc1RGB(Texture.CombinerSource.TextureUnit1);
			t1.setCombineOp1RGB(Texture.CombinerOperandRGB.OneMinusSourceColor);
			t1.setCombineScaleRGB(CombinerScale.One);
		}
		

		if (child != null) {
			{
				{
					if ((child instanceof Node)) {
						Node n = (Node) child;
						List<Spatial> c2 = n.getChildren();
						//int sCounter = 0;
						for (Spatial s2 : c2) {
							ArrayList<Spatial> spatials = new ArrayList<Spatial>();
							Node removeFromNow = null;
							if (s2 instanceof Node)
							{
								for (Spatial s:((Node)s2).getChildren()) 
								{
									spatials.add(s);
								}
								removeFromNow = (Node)s2;
							} else
							{
								spatials.add(s2);
							}
							
							for (Spatial s:spatials) {
								 //if ((s.getType() & s.TRIMESH) != 0)
								{
									//System.out.println("INTERNAL TRANSFORMATION..."+s);
									//if (J3DCore.LOGGING()) Jcrpg.LOGGER.finest("SPATIAL: " + s.getName());
											//+ " " + sCounter++);
									Mesh q = (Mesh) s;
									int l = q.getName().length();
									String key = "";
									if (q.getName().endsWith("_copy"))
										key = ""+q.getName().charAt(l - (1+"_copy".length())); // ardor3d _COPY tag cut
									else
										key = ""+q.getName().charAt(l - (1));
									if (model.removedParts.contains(key)) 
									{
										if (model.LOD>=1 || !J3DCore.SETTINGS.DETAILED_TREES)
											removed.add(q);
									}
									if (model.partNameToTextureCount.containsKey(key)) 
									{
	
										//for (int bc = 0; bc < q.getBatchCount(); bc++)
										
										{
											Mesh b = q;//q.getBatch(bc);
											FloatBuffer fb = b.getMeshData().getVertexBuffer();
											//if (J3DCore.LOGGING()) Jcrpg.LOGGER.finest("BATCH!!"
												//	+ fb.capacity() + " " + bc);
											int maxFIndex = fb.capacity();
											int maxDoubleTri = maxFIndex / 18;
											int fIndex = 0;
											float sumLodX = 0, sumLodY = 0, sumLodZ = 0;
											for (int doubleTriIndex = 0; doubleTriIndex < maxDoubleTri; doubleTriIndex++) {
												// one quad generation for each doubleTriIndex
												float sumX =0, sumY =0, sumZ =0;
												float xDiff = 0;float yDiff = 0; float zDiff = 0;
												int counter = 0;
												for (int triIndex = 0; triIndex < 2; triIndex++) {
													for (int vectorIndex = 0; vectorIndex < 3; vectorIndex++) {
														for (int coord = 0; coord < 3; coord++) {
															if (coord == 0) {
																float x = fb.get(fIndex);
																if (triIndex==0)
																{
																	if (vectorIndex==0)
																	{
																		xDiff = x;
																	}
																	else if (vectorIndex==1)
																	{
																		xDiff = Math.abs(xDiff-x);
																	}
																}
																sumX+= x;
															}
															if (coord == 1) {
																float y = fb.get(fIndex); 
																if (triIndex==0)
																{
																	if (vectorIndex==0)
																	{
																		yDiff = y;
																	}
																	else if (vectorIndex==1)
																	{
																		yDiff = Math.abs(yDiff-y);
																	}
																}
																sumY+= y;
															}
															if (coord == 2) {
																float z = fb.get(fIndex);
																if (triIndex==0)
																{
																	if (vectorIndex==0)
																	{
																		zDiff = z;
																	}
																	else if (vectorIndex==1)
																	{
																		zDiff = Math.abs(zDiff-z);
																	}
																}
																sumZ+= z;
															}
															fIndex++;
														}
														counter++;
													}
												}
												if (model.LOD==3 && added<1)
												{
													if (doubleTriIndex<maxDoubleTri-1)
													{
														sumLodX+=sumX/counter;
														sumLodY+=sumY/counter;
														sumLodZ+=sumZ/counter;
													} else {
														float x = sumLodX/(maxDoubleTri-1);
														float y = sumLodY/(maxDoubleTri-1);
														float z = sumLodZ/(maxDoubleTri-1);
														float xSize = ((xDiff+yDiff+zDiff)/2f*(4f))*model.quadXSizeMultiplier;
														float ySize = ((xDiff+yDiff+zDiff)/2f)*(4f)*model.quadYSizeMultiplier;
														storeQuadParams(q.getName(),states,key,xSize,ySize,x,y,z);
														added++;
													}
												} else
												if (model.LOD==2 && added<1)
												{
													if (doubleTriIndex<maxDoubleTri-1)
													{
														sumLodX+=sumX/counter;
														sumLodY+=sumY/counter;
														sumLodZ+=sumZ/counter;
													} else {
														float x = sumLodX/(maxDoubleTri-1);
														float y = sumLodY/(maxDoubleTri-1);
														float z = sumLodZ/(maxDoubleTri-1);
														float xSize = ((xDiff+yDiff+zDiff)/2f)*2f;
														float ySize = ((xDiff+yDiff+zDiff)/2f)*2f;
														float xSizeM = xSize*model.quadXSizeMultiplier;
														float ySizeM = ySize*model.quadYSizeMultiplier;
														storeQuadParams(q.getName(),states,key,xSizeM,ySizeM,x-xSize/5,y-ySize/5,z-ySize/5);
														storeQuadParams(q.getName(),states,key,xSizeM,ySizeM,x-xSize/5,y+ySize/5,z-ySize/5);
														storeQuadParams(q.getName(),states,key,xSizeM,ySizeM,x+xSize/5,y-ySize/5,z-ySize/5);
														storeQuadParams(q.getName(),states,key,xSizeM,ySizeM,x+xSize/5,y+ySize/5,z-ySize/5);
														
														storeQuadParams(q.getName(),states,key,xSizeM,ySizeM,x-xSize/5,y-ySize/5,z+ySize/5);
														storeQuadParams(q.getName(),states,key,xSizeM,ySizeM,x-xSize/5,y+ySize/5,z+ySize/5);
														storeQuadParams(q.getName(),states,key,xSizeM,ySizeM,x+xSize/5,y-ySize/5,z+ySize/5);
														storeQuadParams(q.getName(),states,key,xSizeM,ySizeM,x+xSize/5,y+ySize/5,z+ySize/5);
														added+=8;
													}
												} else
												if (J3DCore.SETTINGS.DETAILED_TREE_FOLIAGE && model.LOD==0 || J3DCore.SETTINGS.DETAILED_TREE_FOLIAGE && HashUtil.mixPercentage(doubleTriIndex,0,0)%8>model.LOD+1 || !J3DCore.SETTINGS.DETAILED_TREE_FOLIAGE && HashUtil.mixPercentage(doubleTriIndex,0,0)%8>2) 
												{
													float x = sumX/counter;
													float y = sumY/counter;
													float z = sumZ/counter;
													float xSize = ((xDiff+yDiff+zDiff)/2f*(1+model.LOD/2f))*model.quadXSizeMultiplier;
													float ySize = ((xDiff+yDiff+zDiff)/2f)*(1+model.LOD/2f)*model.quadYSizeMultiplier;
													storeQuadParams(q.getName(),states,key,xSize,ySize,x+HashUtil.mixPercentage(doubleTriIndex, 0, 0)/5000f,y-HashUtil.mixPercentage(doubleTriIndex, 0, 0)/5000f,z+HashUtil.mixPercentage(doubleTriIndex, 0, 0)/5000f);
													added++;
												}
											}
										}
										removed.add(q);
									}
								}
							}
							if (removeFromNow!=null) {
								for (Mesh t:removed)
									removeFromNow.detachChild(t);
							}
						}
						for (Mesh t:removed)
							n.detachChild(t);
					}
					
				}
				
			}
		}
		fillBillboardQuadsRotated(horRotated);
	}
	
	public ArrayList<Mesh> containedFoliageMeshes = new ArrayList<Mesh>();
	public ArrayList<Mesh> containedFoliageShadowMeshes = new ArrayList<Mesh>();
	
	/**
	 * Create a real quad for the tree from the abstract data upon constructing the tree.
	 * @param rotated
	 * @param name
	 * @param states
	 * @param key
	 * @param xSize
	 * @param ySize
	 * @param x
	 * @param y
	 * @param z
	 * @return The quad (or null if batched).
	 */
	private Mesh createQuad(boolean rotated, String name,TextureState[] states,String key, float xSize, float ySize, float x, float y, float z)
	{
		String qkey = model.id+rotated+xSize+ySize+internal;
		//Quad targetQuad = quadCache.get(qkey);
		targetQuad = null;
		if (targetQuad == null)
		{
			targetQuad = new Quad(name,xSize,ySize);
			if (model.quadLightStateOff)
			{
				if (!internal) {
					targetQuad.getSceneHints().setLightCombineMode(LightCombineMode.Off); // if this is set off, all sides of the tree equally lit
					J3DCore.hmSolidColorSpatials.put(targetQuad,targetQuad); // if not using this strangely quads get light colored... TODO
				}
			}
			targetQuad.setSolidColor(new ColorRGBA(1,1,1,1));
			targetQuad.setRenderState(states[model.partNameToTextureCount.get(key).intValue()]);
			targetQuad.setRotation(new Quaternion());
			Mesh tBatch = targetQuad;
			
			if (model.atlasTexture)
			{
        		FloatBuffer b = targetQuad.getMeshData().getTextureCoords(0).getBuffer();
        		float position = model.atlasId;
        		int atlas_size = model.atlasSize;
        		if (model.atlasMultiTextureParts)
        		{
        			// choose a random texture position from palette..
        			position = model.atlasMultiIds[Math.abs(((int)((x+y)*100))%model.atlasMultiIds.length)];
        		}
        		float f = 0;
        		for (int bi = 0; bi < b.capacity(); bi++) {
        			if (bi%2==1)
        			{
        				continue;
        			}
        			f = b.get(bi);
        			b.put(bi, (f / atlas_size)+ position/atlas_size);
        		}
			}
			
			// swapping X,Z
			/*if (!NO_BATCH_GEOMETRY && rotated) {
				FloatBuffer buff = tBatch.getVertexBuffer();
				for (int i=0; i<4; i++)
				{
					float cX = -1;
					float cZ = -1;
					for (int j=0; j<3; j++) {
						if (j==0) {
							cX = buff.get(i*3+j);
						} else
						if (j==2)
						{
							cZ = buff.get(i*3+j);
						}
					}
					buff.put(i*3 , -cZ);
					buff.put(i*3 + 2 , -cX);
				}
			}*/
			
			//quadCache.put(qkey, targetQuad);
		}
		targetQuad.setTranslation(x, z, -y);
		targetQuad.setRotation(new Quaternion());
		//targetQuad.getWorldRotation().set(new Quaternion());
		targetQuad.setModelBound(new BoundingBox());
		targetQuad.updateModelBound();
		/*if (batch==null)
		{
			NodePlaceholder fake = new NodePlaceholder();
			fake.setLocalTranslation(new Vector3());
			batch = new TrimeshGeometryBatch(model.id,core,targetQuad,internal,fake);
			batch.animated = !internal && J3DCore.ANIMATED_TREES && model.windAnimation;
			batch.setName("---");
			batch.parent.setName("---");
		}*/
		//targetQuad.setLocalTranslation(x, z, -y);
		//quad.setLocalTranslation(x, y, z);
		//batch.addItem(null, targetQuad);
		//System.out.println("--- ADDING: "+targetQuad.getName());
		Mesh m = PooledSharedNode.copyMesh("c",targetQuad);
		
		Matrix3 m3;
		m3 = J3DCore.qE.toRotationMatrix((Matrix3)null);
		
		m.setRotation(m3);//J3DCore.new Matrix3().fromAngles(40.5f, 90.5f, 20.5f));
		
		//Mesh m2 = PooledSharedNode.copyMesh("c",targetQuad);
		//m3 = J3DCore.qS.toRotationMatrix((Matrix3)null);
		//m2.setRotation(m3);
		
		Mesh m4 = PooledSharedNode.copyMesh("c",targetQuad);
		m3 = J3DCore.qN.add(J3DCore.qE, null).toRotationMatrix((Matrix3)null);
		m4.setRotation(m3);
		//Mesh m5 = PooledSharedNode.copyMesh("c",targetQuad);
		//m3 = J3DCore.qN.add(J3DCore.qW, null).toRotationMatrix((Matrix3)null);
		//m5.setRotation(m3);
		
		containedFoliageMeshes.add(targetQuad);
		
		// TODO not an optimal solution? Test with ati
		if (J3DCore.SETTINGS.SHADOWS)
		{
			containedFoliageMeshes.add(m);
			containedFoliageMeshes.add(m4);
		}
		
		//containedFoliageMeshes.add(m2);
		//containedFoliageMeshes.add(m5);
		/*Sphere s = new Sphere("-",4,14,xSize);
		s.setTranslation(x, z, -y);
		s.setModelBound(new BoundingBox());
		s.updateModelBound();
		containedFoliageShadowMeshes.add(s);
			*/
		return null;
	}
	/**
	 * Storing a replacer quad's abstract description for the model for later addition to the tree (in form of quad or batchgeom).
	 * @param name
	 * @param states
	 * @param key
	 * @param xSize
	 * @param ySize
	 * @param x
	 * @param y
	 * @param z
	 */
	private void storeQuadParams(String name,TextureState[] states,String key, float xSize, float ySize, float x, float y, float z)
	{
		quads.add(new QuadParams(name,states,key,xSize,ySize,x,y,z));
	}
	
	public Spatial foliagelessModelSpatial= null;
	
	@Override
	public int attachChild(Spatial child) {
		if (!"---".equals(child.getName())) 
		{
			transformTrimeshesToQuads(child);
			// we don't attach the transformed child - it's the trunk mesh stripped from foliage, used 
			// later in modelGeometryBatch form only.
			foliagelessModelSpatial = child;
			return 0;//children.size();
		} else
		{
			return super.attachChild(child);
		}
	}

	@Override
	public int attachChildAt(Spatial child, int index) {
		transformTrimeshesToQuads(child);
		return super.attachChildAt(child, index);
	}



	boolean windSwitch = true;
	Vector3 origTranslation = null;
	long passedTime = 0;
	double timeCounter = 0;
	long startTime = System.currentTimeMillis();
	
	public double windPower = 0.5f; 
	
	public static final double TIME_DIVIDER = 400;
	public static final long TIME_LIMIT = 0;
	
	double diffs[] = new double[5];
	double newDiffs[] = new double[5];
	
	public void draw(Renderer r) {
		boolean doGrassMove = false;
		Quaternion orient = null;
		if (NO_BATCH_GEOMETRY) {
			if (origTranslation == null)
				origTranslation = new Vector3(this.getTranslation());
			
			long additionalTime = Math.min(System.currentTimeMillis() - startTime,32);
			passedTime += additionalTime;
			startTime= System.currentTimeMillis();
	
			
			if (J3DCore.SETTINGS.ANIMATED_GRASS && model.windAnimation) {
				doGrassMove = true;
			}
	
			if (getChildren() == null || getChildren().size()==0) {
				return;
			}
	
			double diff = 0;
	
			if (doGrassMove) {
				// creating 5 diffs to look random
				diff = 0.059d * FastMath.sin(((passedTime / TIME_DIVIDER) * windPower)) * windPower;
				newDiffs[0] = diff;
				diff = 0.059d * FastMath.sin((((passedTime + 500) / TIME_DIVIDER) * windPower * (0.5f)))
						* windPower;
				newDiffs[1] = diff;
				diff = 0.059d * FastMath.sin((((passedTime + 500) / TIME_DIVIDER) * windPower * (0.6f)))
						* windPower;
				newDiffs[2] = diff;
				diff = 0.059d * FastMath.sin((((passedTime + 1000) / TIME_DIVIDER) * windPower * (0.8f)))
						* windPower;
				newDiffs[3] = diff;
				diff = 0.059d * FastMath.sin((((passedTime + 2000) / TIME_DIVIDER) * windPower * (0.7f)))
						* windPower;
				newDiffs[4] = diff;
			}
			diffs = newDiffs;
	
			Vector3 look = cam.getDirection().negate(null);
			Vector3 left1 = cam.getLeft().negate(null);
			orient = new Quaternion();
			orient.fromAxes(left1, cam.getUp(), look);
	
			
		}
		Spatial child;
		for (int i = 0, cSize = getChildren().size(); i < cSize; i++) {
			int whichDiff = 0;
			if (J3DCore.SETTINGS.ANIMATED_GRASS)
				whichDiff = i % 5;

			child = getChildren().get(i);

			// billboard world rotation calc

			if (child != null) {
				//tmpVec = new Vector3(cam.getLocation());
				double distSquared = tmpVec.set(cam.getLocation()).subtractLocal(child.getWorldTranslation())
						.lengthSquared();
				if (!J3DCore.SETTINGS.LOD_VEGETATION || distSquared <= viewDistance * viewDistance)
				// 
				{

					
					// original code
					// TODO r.setCamera(cam);
					child.updateGeometricState(0.0f, false);
					child.onDraw(r);

					if (NO_BATCH_GEOMETRY) {
					
						// animation
	
						if (child instanceof Node) {
							Node n = (Node) child;
							List<Spatial> c2 = n.getChildren();
							int sCounter = 0;
							for (Spatial s : c2) {
								if ( (s instanceof Mesh))
								{
									// if (J3DCore.LOGGING()) Jcrpg.LOGGER.finest("SPATIAL: "+s.getName()+"
									// "+sCounter++);
									sCounter++;
									Mesh q = (Mesh) s;
									// if (q.getType() == Quad.Qinstanceof Quad)
	
									String qname = q.getName();
									int l = 0;
									if (qname != null)
										l = qname.length();
									if (l != 0 && q.getName().charAt(l - 1) == model.billboardPartNames[0].charAt(0)) {
										q.setWorldRotation(orient);
	
										if (!(doGrassMove))
											continue;
										// CPU computed grass moving
										Mesh b = q;
										FloatBuffer fb = b.getMeshData().getVertexBuffer();
										for (int fIndex = 0; fIndex < 4 * 3; fIndex++) {
											boolean f2_1Read = false;
											boolean f2_2Read = false;
											double f2_1 = 0;
											double f2_2 = 0;
											if (fIndex<3 || fIndex>=9 && fIndex<12) {
												int mul = 1;
												if (Math.floor(fIndex / 3) == 3)
													mul = -1;
												if (fIndex % 3 == 0) {
													//float f = fb.get(fIndex);
													if (!f2_1Read) {
														f2_1 = fb.get(fIndex + 3 * mul);
														f2_1Read = true;
													}
													fb.put(fIndex, (float)(f2_1 + diffs[whichDiff]));
												}
												if (fIndex % 3 == 2) {
													//float f = fb.get(fIndex);
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
		}
	}

	public void update(NodePlaceholder place) {
		// TODO Auto-generated method stub
		
	}
	
	
}
