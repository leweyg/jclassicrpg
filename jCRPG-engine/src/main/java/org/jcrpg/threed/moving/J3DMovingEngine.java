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

package org.jcrpg.threed.moving;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.logging.Logger;

import org.jcrpg.apps.Jcrpg;
import org.jcrpg.game.logic.ImpactUnit;
import org.jcrpg.threed.J3DCore;
import org.jcrpg.threed.NodePlaceholder;
import org.jcrpg.threed.PooledNode;
import org.jcrpg.threed.engine.program.EffectNode;
import org.jcrpg.threed.engine.ui.FadeController;
import org.jcrpg.threed.engine.ui.FlyingNode;
import org.jcrpg.threed.engine.ui.NodeFontFreer;
import org.jcrpg.threed.engine.ui.ZoomingParentNode;
import org.jcrpg.threed.engine.ui.FadeController.FadeMode;
import org.jcrpg.threed.scene.config.MovingTypeModels;
import org.jcrpg.threed.scene.model.effect.EffectProgram;
import org.jcrpg.threed.scene.model.moving.MovingModelAnimDescription;
import org.jcrpg.threed.scene.moving.RenderedMovingUnit;
import org.jcrpg.ui.Characters;
import org.jcrpg.ui.FontUtils;
import org.jcrpg.ui.text.FontTT;
import org.jcrpg.world.ai.Ecology;
import org.jcrpg.world.ai.EntityMember;
import org.jcrpg.world.ai.EntityScaledRelationType;
import org.jcrpg.world.ai.fauna.VisibleLifeForm;

import com.ardor3d.math.ColorRGBA;
import com.ardor3d.math.Matrix3;
import com.ardor3d.math.Quaternion;
import com.ardor3d.math.Vector3;
import com.ardor3d.renderer.queue.RenderBucketType;
import com.ardor3d.renderer.state.ZBufferState;
import com.ardor3d.scenegraph.Node;
import com.ardor3d.scenegraph.Spatial;
import com.ardor3d.scenegraph.extension.BillboardNode;
import com.ardor3d.scenegraph.hint.CullHint;
import com.ardor3d.scenegraph.hint.TextureCombineMode;

/**
 * Moving units 3d display part.
 * @author illes
 */
public class J3DMovingEngine {

	Logger logger = Logger.getLogger(J3DMovingEngine.class.getName());
	
	protected J3DCore core = null;
	
	MovingTypeModels movingTypeModels = null;
	
	protected HashMap<String, RenderedMovingUnit> units = new HashMap<String, RenderedMovingUnit>();
	
	public HashSet<RenderedMovingUnit> activeUnits = new HashSet<RenderedMovingUnit>();
	public HashSet<EffectNode> activeEffectNodes = new HashSet<EffectNode>();
	//public static HashSet<FlyingNode> activeFlyingNodes = new HashSet<FlyingNode>();
	
	public boolean isEnginePlaying()
	{
		return activeUnits.size()>0 || activeEffectNodes.size()>0;
	}
	
	
	public J3DMovingEngine(J3DCore core)
	{
		this.core = core;
		movingTypeModels = new MovingTypeModels();
	}
	
	boolean firstRender = false;
	
	public HashMap<EffectProgram, ArrayList<EffectNode>> effectNodes = new HashMap<EffectProgram, ArrayList<EffectNode>>();
	
	public void playEffectProgram(EffectProgram program, VisibleLifeForm source, VisibleLifeForm target)
	{
		
		EffectNode eNode = program.get3DVisualization();
		ArrayList<EffectNode> nodes = effectNodes.get(program);
		if (nodes==null)
		{
			nodes = new ArrayList<EffectNode>();
			effectNodes.put(program, nodes);
		}
		if (J3DCore.LOGGING()) Jcrpg.LOGGER.fine("playEffectProgram"+eNode.getClass());
		nodes.add(eNode);
		eNode.sourceForm = source;
		eNode.targetForm = target;
		activeEffectNodes.add(eNode);
		
		
	}
	public void endEffectProgram(EffectProgram program, EffectNode node)
	{
		try
		{
			if (J3DCore.LOGGING()) Jcrpg.LOGGER.fine("endEffectProgram"+node.getClass());
			effectNodes.get(program).remove(node);
			node.startedPlaying = false;
			node.removeFromParent();
			node.clearUp();
			activeEffectNodes.remove(node);
		} catch (Exception ex)
		{
			
		}
		
	}
	
	
	/**
	 * Renders a set of node into 3d space, rotating, positioning them.
	 * @param n Nodes
	 * @param unit the r.cube parent of the nodes, needed for putting the rendered node as child into it.
	 */
	protected void renderNodes(NodePlaceholder[] n, RenderedMovingUnit unit)
	{
		if (n==null) return;
	
		for (int i=0; i<n.length; i++) {
			n[i].setLocalTranslation(new Vector3(unit.c3dX,unit.c3dY,unit.c3dZ));
			n[i].getLocalTranslation().subtractLocal(new Vector3(core.gameState.getCurrentRenderPositions().origoX,core.gameState.getCurrentRenderPositions().origoY,core.gameState.getCurrentRenderPositions().origoZ).multiply(J3DCore.CUBE_EDGE_SIZE,null));
			Quaternion q = new Quaternion();
			Quaternion qC = null;
			if (n[i].model.noSpecialSteepRotation) {
				qC = new Quaternion(q); // base rotation
			} else
			{
				qC = new Quaternion();
			}
			
			n[i].setLocalRotation(qC);
			//if (J3DCore.LOGGING()) Jcrpg.LOGGER.fine("- "+unit.id+" "+unit.form.member);
			VisibleLifeForm form = unit.form;
			//EntityMemberInstance member = form.member;
			EntityMember desc = form.type;
			//if (J3DCore.LOGGING()) Jcrpg.LOGGER.fine("DESC: "+desc.getClass().getSimpleName()+" "+desc.getScale()[0]);
			float[] scale = desc.getScale();
			scale[0] *= n[i].model.scale[0];
			scale[1] *= n[i].model.scale[1];
			scale[2] *= n[i].model.scale[2];
			n[i].setLocalScale(new Vector3(scale[0],scale[1],scale[2]));
			{
				// scaling for md5 needs substraction
				n[i].getLocalTranslation().subtractLocal(new Vector3(0,(1-scale[2])*0.4f,0).multiply(J3DCore.CUBE_EDGE_SIZE,null));
				float[] d = (unit.models[0]).disposition;
				n[i].getLocalTranslation().addLocal(d[0],d[1]-0.93f,d[2]);
			}
			if (unit.onSteep)
			{
				n[i].getLocalTranslation().addLocal(new Vector3(0,.5f,0).multiply(J3DCore.CUBE_EDGE_SIZE,null));
			}
			
			unit.nodePlaceholders.add((NodePlaceholder)n[i]);
			//liveNodes++;
		}
	}
	
	public void clearUnitTextNodes(RenderedMovingUnit u)
	{
		if (u.circleNode!=null)
		{
			u.circleNode.removeFromParent();
			FontTT font = currentTextNodes.remove(u.circleNode.getChild(0));
			if (font!=null)
			{
				font.moveFreedToCache((Node)u.circleNode.getChild(0));
			}
		}
		if (u.sizeTextNode!=null)
		{
			u.sizeTextNode.removeFromParent();
			FontTT font = currentTextNodes.remove(u.sizeTextNode.getChild(0));
			if (font!=null)
			{
				//System.out.println("SIZE FREEING "+u.form.encounterUnitData.getName());
				font.moveFreedToCache((Node)u.sizeTextNode.getChild(0));
			}
		}
		if (u.memberTypeNameNode!=null)
		{
			u.memberTypeNameNode.removeFromParent();
			FontTT font = currentTextNodes.remove(u.memberTypeNameNode.getChild(0));
			if (font!=null)
			{
				//System.out.println("TYPE FREEING "+u.form.encounterUnitData.getName());
				font.moveFreedToCache((Node)u.memberTypeNameNode.getChild(0));
			}
		}
	}
	
	public void clearUnit(RenderedMovingUnit u)
	{
		for (NodePlaceholder n:u.nodePlaceholders)
		{
			PooledNode pooledRealNode = n.realNode;
			n.realNode = null;
			clearUnitTextNodes(u);
			if (pooledRealNode!=null) {
				Node realNode = (Node)pooledRealNode;
				if (J3DCore.SETTINGS.SHADOWS) core.removeOccludersRecoursive(realNode);
				realNode.removeFromParent();
				core.modelPool.releaseNode(pooledRealNode);
			}
		}
		units.remove(u);
		activeUnits.remove(u);
		
	}
	
	public void clearPreviousUnits()
	{
		for (RenderedMovingUnit u:units.values())
		{
			for (NodePlaceholder n:u.nodePlaceholders)
			{
				PooledNode pooledRealNode = n.realNode;
				n.realNode = null;
				clearUnitTextNodes(u);
				if (pooledRealNode!=null) {
					Node realNode = (Node)pooledRealNode;
					if (J3DCore.SETTINGS.SHADOWS) core.removeOccludersRecoursive(realNode);
					realNode.removeFromParent();
					core.modelPool.releaseNode(pooledRealNode);
				}
			}
		}
		units.clear();
	}
	
	/**
	 * Renders the moving units inside the render distance : looks for life forms in the World in reach of the player.
	 */
	public void render(Collection<VisibleLifeForm> forms)
	{
		
		clearPreviousUnits();
		int i=0;
		for (VisibleLifeForm form:forms)
		{
			if (form.notRendered) continue;
			RenderedMovingUnit unit = materializeLifeForm(form);
			unit.direction = (i%2==1?0:1);
			NodePlaceholder[] placeHolders = core.modelPool.loadMovingPlaceHolderObjects(unit, unit.models, false);
			renderNodes(placeHolders, unit);
			i++;			
		}
		renderToViewPort(0f);
	}
	
	public static ArrayList<ColorRGBA> lineupColors = new ArrayList<ColorRGBA>();
	static 
	{
		lineupColors.add(new ColorRGBA(ColorRGBA.WHITE));
		lineupColors.add(new ColorRGBA(ColorRGBA.LIGHT_GRAY));
		lineupColors.add(new ColorRGBA(ColorRGBA.DARK_GRAY));
		lineupColors.add(new ColorRGBA(ColorRGBA.BLACK));
	}
	
	ZBufferState zInFG = null;
	public ZBufferState getZBuffInForegroundState()
	{
		if (zInFG==null)
		{
			zInFG = new ZBufferState();
			zInFG.setFunction(ZBufferState.TestFunction.Always);
		}
		return zInFG;
		
	}
	
	public HashMap<Node,FontTT> currentTextNodes = new HashMap<Node,FontTT>();
	
	/**
	 * Creates a flying node with numbers for not-0 impact points
	 * @param unit
	 * @return
	 */
	private FlyingNode getImpactPointsBillboardNode(ImpactUnit unit)
	{
		BillboardNode n = new BillboardNode("name");
		n.setAlignment(BillboardNode.BillboardAlignment.ScreenAligned);
		int counter = 0;
		int addedCounter = 0;
		ArrayList<Runnable> freers = new ArrayList<Runnable>();
		for (Integer i:unit.orderedImpactPoints)
		{
			if (i!=null && i!=0)
			{
				ColorRGBA color = Characters.pointQuadData.get(counter);
				Node slottextNode = FontUtils.textNonBoldVerdana.createOutlinedText(""+i, 1,color,new ColorRGBA(0.8f,0.8f,0.8f,1f),false);
				freers.add(new NodeFontFreer(FontUtils.textNonBoldVerdana,slottextNode));
				slottextNode.setTranslation(0.1f*addedCounter, 0f, 0f);
				ZBufferState state = getZBuffInForegroundState();
				n.attachChild(slottextNode);
				slottextNode.getSceneHints().setCullHint( CullHint.Never);
				slottextNode.getSceneHints().setRenderBucketType(RenderBucketType.Transparent);
				slottextNode.getSceneHints().setTextureCombineMode( TextureCombineMode.Replace );
				n.setRenderState(state);
				addedCounter++;
			}
			counter++;
		}
		n.setTranslation(new Vector3(0.2f,1.6f,0.1f));
		n.setScale(0.17f);
		FlyingNode fn = new FlyingNode();
		fn.onFinish = freers;
		fn.attachChild(n);
		return fn;
	}
	
	
	
	public void getVisibleFormBillboardNodes(RenderedMovingUnit unit)
	{
		if (unit.form.forGroup()) {
			BillboardNode n = new BillboardNode("name");
			n.setAlignment(BillboardNode.BillboardAlignment.ScreenAligned);
			Node slottextNode = null;
			
			/*if (J3DCore.NATIVE_FONT_RENDER)
			{
				slottextNode = new Node("");
				Text text = Text.createDefaultTextLabel("gname",""+unit.form.getSize());
				text.setTextColor(new ColorRGBA(0.9f,0.9f,0.9f,1f));
				slottextNode.attachChild(text);
				slottextNode.setLightCombineMode(LightCombineMode.Off);
				Renderer renderer = DisplaySystem.getDisplaySystem().getRenderer();
				BlendState as1 = renderer.createBlendState();
				as1.setBlendEnabled( true );
				as1.setSourceFunction( BlendState.SourceFunction.SourceAlpha);
				as1.setDestinationFunction( BlendState.DestinationFunction.OneMinusSourceAlpha);
				as1.setEnabled( true );
				slottextNode.setRenderState(as1);
			} else*/
			{
				slottextNode = FontUtils.textNonBoldVerdana.createOutlinedText(""+unit.form.getSize(), 1, new ColorRGBA(0.9f,0.9f,0.9f,1f),new ColorRGBA(0.8f,0.8f,0.8f,1f),false);
				currentTextNodes.put(slottextNode, FontUtils.textNonBoldVerdana);
			}
			slottextNode.getSceneHints().setCullHint( CullHint.Never);
			slottextNode.getSceneHints().setTextureCombineMode( TextureCombineMode.Replace );
			slottextNode.getSceneHints().setRenderBucketType(RenderBucketType.Transparent);
			ZBufferState s = new ZBufferState();//J3DCore.getInstance().getDisplay().getRenderer().createZBufferState();
			s.setFunction(ZBufferState.TestFunction.Always);
			//s.setEnabled(false);
			//slottextNode.setRenderState(s);
			n.attachChild(slottextNode);
			n.setRenderState(s);
			
			//n.setLocalTranslation(new Vector3(0,2.5f,0));
			float dispX = unit.models[0].disposition[0];
			float dispY = unit.models[0].disposition[1];
			float dispZ = unit.models[0].disposition[2];
			n.setTranslation(new Vector3(0.5f-dispX,0.20f-dispY,0.2f-dispZ));
			n.setScale(0.095f);
			unit.sizeTextNode = n;
		}
		{		
			
			ColorRGBA c = new ColorRGBA(0.9f,0.9f,0.9f,1f);
			int relation = unit.form.entity.relations.getRelationLevel(core.gameState.player.theFragment);
			if (relation>EntityScaledRelationType.NEUTRAL)
			{
				c = new ColorRGBA(ColorRGBA.GREEN);
			} else
			if (relation<EntityScaledRelationType.NEUTRAL)
			{
				c = new ColorRGBA(ColorRGBA.RED);
			}
			
			BillboardNode n = new BillboardNode("name2");
			n.setAlignment(BillboardNode.BillboardAlignment.ScreenAligned);

			Node slottextNode = null;
			/*if (J3DCore.NATIVE_FONT_RENDER)
			{
				slottextNode = new Node("");
				Text text = Text.createDefaultTextLabel("gname",(unit.form.getLineupLine()+1)+". "+(unit.form.forGroup()?unit.form.type.getName():unit.form.member.getName()));
				text.setTextColor(new ColorRGBA(0.9f,0.9f,0.9f,1f));
				slottextNode.attachChild(text);
				slottextNode.setLightCombineMode(LightCombineMode.Off);
				Renderer renderer = DisplaySystem.getDisplaySystem().getRenderer();
				BlendState as1 = renderer.createBlendState();
				as1.setBlendEnabled( true );
				as1.setSourceFunction( BlendState.SourceFunction.SourceAlpha);
				as1.setDestinationFunction( BlendState.DestinationFunction.OneMinusSourceAlpha);
				as1.setEnabled( true );
				slottextNode.setRenderState(as1);
			} else*/
			{
				slottextNode = FontUtils.textNonBoldVerdana.createOutlinedText((unit.form.getLineupLine()+1)+". "+(unit.form.forGroup()?unit.form.type.getName():unit.form.member.getName()), 1, new ColorRGBA(0.9f,0.9f,0.9f,1f),c,true);
				currentTextNodes.put(slottextNode, FontUtils.textNonBoldVerdana);
			}

			n.attachChild(slottextNode);
			slottextNode.getSceneHints().setCullHint( CullHint.Never);
			slottextNode.getSceneHints().setRenderBucketType(RenderBucketType.Transparent);
			ZBufferState s = new ZBufferState();
			s.setFunction(ZBufferState.TestFunction.Always);
			//slottextNode.setRenderState(s);
			//s.setEnabled(false);
			n.setRenderState(s);
			
			//n.setLocalTranslation(new Vector3(0,2.5f,0));
			float dispX = unit.models[0].disposition[0];
			float dispY = unit.models[0].disposition[1];
			float dispZ = unit.models[0].disposition[2];
			n.setTranslation(new Vector3(0.3f-dispX,0.34f-dispY,0.2f-dispZ));
			//n.setLocalTranslation(new Vector3(0.3f,0.34f-dispY,0.2f));
			n.setScale(0.067f);
			unit.memberTypeNameNode= n;
		}

		
		/*if (true==false)
		{
			// creating circle around the unit, currently unused
			
			Node n = new Node("name2");
			//n.setAlignment(BillboardNode.AXIAL_Z);
			Node slottextNode = FontUtils.textNonBoldVerdana.createOutlinedText("o", 1, new ColorRGBA(0.3f,0.9f,0.3f,1f),new ColorRGBA(0.1f,0.6f,0.1f,1f),true);
			currentTextNodes.put(slottextNode, FontUtils.textNonBoldVerdana);
			n.attachChild(slottextNode);
			slottextNode.setCullHint( CullHint.Never);
			ZBufferState s = J3DCore.getInstance().getDisplay().getRenderer().createZBufferState();
			s.setFunction(ZBufferState.TestFunction.Always);
			//slottextNode.setRenderState(s);
			n.setRenderState(s);
			n.setLocalRotation(J3DCore.qT);
			
			//n.setLocalTranslation(new Vector3(0,2.5f,0));
			n.setLocalTranslation(new Vector3(0.0f,0.05f,0));
			n.setLocalScale(1.1f);
			unit.circleNode = n;
		}*/
	}
	
	public void updateUnitTextNodes(RenderedMovingUnit unit)
	{
		clearUnitTextNodes(unit);
		getVisibleFormBillboardNodes(unit);
		NodePlaceholder n = unit.nodePlaceholders.iterator().next();
		Node realPooledNode = (Node)n.realNode;
		if (realPooledNode!=null) {
			if (unit.sizeTextNode!=null)
			{
				realPooledNode.attachChild(unit.sizeTextNode);	
			}
			realPooledNode.attachChild(unit.memberTypeNameNode);
		}
	}
	
	public void visualizeImpactPoints(RenderedMovingUnit unit, ImpactUnit impact)
	{
		FlyingNode node = getImpactPointsBillboardNode(impact);
		// repositioning the starting based on model disposition, otherwise it would be out of camera view...
		node.setTranslation(-unit.models[0].disposition[0], -unit.models[0].disposition[1], -unit.models[0].disposition[2]);
		NodePlaceholder n = unit.nodePlaceholders.iterator().next();
		Node realPooledNode = (Node)n.realNode;
		if (realPooledNode!=null) {
			realPooledNode.attachChild(node);	
		}
		node.startFlying();
		
	}
	
	
	public void highlightUnitTemporarily(RenderedMovingUnit unit)
	{
		ZoomingParentNode node = new ZoomingParentNode();
		NodePlaceholder n = unit.nodePlaceholders.iterator().next();
		Node realPooledNode = (Node)n.realNode;
		if (realPooledNode!=null) {
			if (unit.memberTypeNameNode!=null)
			{
				boolean zoomingFound = false;
				for (Spatial s:unit.memberTypeNameNode.getChildren())
				{
					if (s instanceof ZoomingParentNode)
					{
						node = (ZoomingParentNode)s;
						zoomingFound = true;
						break;
					}
				} 
				if (!zoomingFound)
				{
					unit.memberTypeNameNode.attachChild(node);
				}
				node.startZoomCycle();
			}
			//realPooledNode.attachChild(node);	
		}
		
	}
	
	
	protected boolean needsFadeIn = false;
	
	boolean firstRenderToViewPort = true;
	/**
	 * Set in view units visible / out of view units invisible on every movement of player or every new turn if no
	 * movement. 
	 * @param refAngle
	 */
	public void renderToViewPort(float refAngle)
	{
			for (RenderedMovingUnit unit: units.values())
			{
				if (unit.nodePlaceholders.iterator().next().realNode==null)
				{
					System.out.println("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% RENDERING: "+ unit.form.member+ " "+unit.form.entity);
					for (NodePlaceholder n : unit.nodePlaceholders)
					{
						Node realPooledNode = (Node)core.modelPool.getMovingModel(unit, n.model, n);
						n.realNode = (PooledNode)realPooledNode;
						realPooledNode.setTranslation(n.getLocalTranslation());
						realPooledNode.setRotation(n.getLocalRotation());
						realPooledNode.setScale(n.getLocalScale());
						//realPooledNode.attachChild(unit.circleNode);
						
						
						if (unit.internal) {
							core.gameState.getCurrentStandingEngine().extRootNode.
								attachChild((Node)realPooledNode);
							if (J3DCore.SETTINGS.SHADOWS) core.addOccluder((Node)realPooledNode);
						} else 
						{
							core.gameState.getCurrentStandingEngine().extRootNode.
								attachChild((Node)realPooledNode);
							if (J3DCore.SETTINGS.SHADOWS) core.addOccluder((Node)realPooledNode);
							//core.encounterIntRootNode.attachChild((Node)realPooledNode);
						}
						if (!needsFadeIn) // ugly check for perceptionEngine... only encounter engine needs cull never
						{
							realPooledNode.getSceneHints().setCullHint(CullHint.Never); // added this one because otherwise some units were culled for no good reason. temp fix. 
						}
						
						if (needsFadeIn)
						{
								PooledNode pooledRealNode = n.realNode;
								if (pooledRealNode!=null) {
									Node realNode = (Node)pooledRealNode;
									FadeController c = new FadeController(pooledRealNode,realNode,1f, FadeMode.FadingIn);
									J3DCore.controllers.add(c);
								}
						}
					}
					updateUnitTextNodes(unit);
					if (unit.form.inEncounterPhase==Ecology.PHASE_TURNACT_COMBAT)
					{
						unit.changeToAnimation(MovingModelAnimDescription.ANIM_IDLE_COMBAT);
					} else
					{
						unit.changeToAnimation(MovingModelAnimDescription.ANIM_IDLE);
					}
				}
			}
	}
	
	int moveCount = 0;
	
	/**
	 * No movement states.
	 */
	public static HashSet<String> simpleStates = new HashSet<String>();
	static 
	{
		simpleStates.add(MovingModelAnimDescription.ANIM_DEATH_NORMAL);
		simpleStates.add(MovingModelAnimDescription.ANIM_DEATH_QUICK);
		simpleStates.add(MovingModelAnimDescription.ANIM_DEATH_SLOW);
		simpleStates.add(MovingModelAnimDescription.ANIM_PAIN);
		simpleStates.add(MovingModelAnimDescription.ANIM_ATTACK_UPPER);
		simpleStates.add(MovingModelAnimDescription.ANIM_ATTACK_LOWER);
		simpleStates.add(MovingModelAnimDescription.ANIM_CAST);
		simpleStates.add(MovingModelAnimDescription.ANIM_THROW);
		simpleStates.add(MovingModelAnimDescription.ANIM_DEFEND_UPPER);
		simpleStates.add(MovingModelAnimDescription.ANIM_DEFEND_LOWER);
		simpleStates.add(MovingModelAnimDescription.ANIM_COMMUNICATE_AGRESSIVE);
		simpleStates.add(MovingModelAnimDescription.ANIM_COMMUNICATE_HATRED);
		simpleStates.add(MovingModelAnimDescription.ANIM_COMMUNICATE_NORMAL);
		simpleStates.add(MovingModelAnimDescription.ANIM_COMMUNICATE_PATIENT);
		simpleStates.add(MovingModelAnimDescription.ANIM_FRIENDLY);
	}
	
	
	
	VisibleLifeForm playerFakeForm = new VisibleLifeForm("player",null,null,null);
	/**
	 * Updates moving units 3d embodiment in real time.
	 * @param timePerFrame Value passed since last frame.
	 */
	public void updateScene(double timePerFrame)
	{
		playerFakeForm.worldX = core.gameState.getCurrentRenderPositions().viewPositionX;
		playerFakeForm.worldY = core.gameState.getCurrentRenderPositions().viewPositionY;
		playerFakeForm.worldZ = core.gameState.getCurrentRenderPositions().viewPositionZ;
		
		ArrayList<Object[]> toEnd = new ArrayList<Object[]>();
		for (EffectProgram p:effectNodes.keySet())
		{
			ArrayList<EffectNode> nodes = effectNodes.get(p);
			for (EffectNode n:nodes)
			{
//				if (J3DCore.LOGGING()) Jcrpg.LOGGER.fine("PLAYING "+n.getClass());
				System.out.println("PLAYING "+n.getClass());
				if (!n.startedPlaying)
				{
					n.startedPlaying = true;
					VisibleLifeForm target = n.sourceForm==null?playerFakeForm:n.sourceForm;
					Vector3 pos = null;
					if (target.worldX==playerFakeForm.worldX && target.worldY==playerFakeForm.worldY && target.worldZ==playerFakeForm.worldZ)
					{
						target.worldY -= 1;
						// giving a little flight from below
						pos = calculatePositionVector(null,target,true);
						target.worldY += 1;
					} else
					{
						pos = calculatePositionVector(null,target,true);	
					}
					
					n.setPosition(pos, null);
					n.effectStartTime = System.currentTimeMillis();
					core.gameState.getCurrentStandingEngine().extRootNode.
						attachChild(n);
					
				}
				VisibleLifeForm target = n.targetForm==null?playerFakeForm:n.targetForm;
				//if (J3DCore.LOGGING()) Jcrpg.LOGGER.fine("EFFECT TARGET ########### "+(target==playerFakeForm)+" "+target.worldX+" "+target.worldY+" "+target.worldZ);
				Vector3 cVec = n.currentPos;
				Vector3[] rVectors = calculateNewPositionOfMovementAndEndForUnit(cVec, target.renderedUnit, n.speed, timePerFrame,false);
				Vector3 mVec = rVectors[0];
				Vector3 eVec = rVectors[1];
				n.currentPos.addLocal(mVec);
				rVectors = calculateNewPositionOfMovementAndEndForUnit(cVec, target.renderedUnit, n.speed, timePerFrame,true);
				//if (J3DCore.LOGGING()) Jcrpg.LOGGER.fine(n.currentPos);
				
				double prevDist = eVec.distance(n.currentPos); // getting distance before move to be able to check if dist is still decreasing
				double angleTurn = n.prevDisplacement==null?0:mVec.smallestAngleBetween(n.prevDisplacement);
				if (J3DCore.LOGGING()) logger.finest("ANG: "+angleTurn +" DIST = "+prevDist+" "+ n.currentPos + " "+J3DCore.getInstance().getCamera().getLocation());

				Matrix3 current = new Matrix3(n.getAngle());
				if (current!=null) {
					current = calculateRotationForMovingDirection(rVectors[0], current);
				}
				n.setPosition(n.currentPos,current);
				
				
				double dist = eVec.distance(n.currentPos);
				//if (J3DCore.LOGGING()) Jcrpg.LOGGER.fine("######### "+dist);
				
				if (System.currentTimeMillis()-n.effectStartTime>10000)
				{
					toEnd.add(new Object[]{p,n});
				} else
				if (dist<0.1f || prevDist>dist || angleTurn>1.8f) // checking if near, or distance is over, or angle is turning back (moved over target)
				{
					toEnd.add(new Object[]{p,n});
				}				
				n.prevDisplacement = mVec;
			}
			for (Object[] t:toEnd)
			{
				endEffectProgram((EffectProgram)t[0], (EffectNode)t[1]);
			}
		}
		
		for (RenderedMovingUnit unit: units.values())
		{
			for (NodePlaceholder n : unit.nodePlaceholders)
			{
				if (n.realNode!=null)
				{
					if (unit.state.equals(MovingModelAnimDescription.ANIM_IDLE) || unit.state.equals(MovingModelAnimDescription.ANIM_IDLE_COMBAT))
					{
						
						//VisibleLifeForm target = unit.form.targetForm==null?playerFakeForm:unit.form.targetForm;
						Vector3 cVec = n.getLocalTranslation();
						
						Vector3[] rVectors = calculateNewPositionOfMovementAndEndForUnitTarget(cVec, unit, 20f, timePerFrame,false);		
						//Vector3 eVec = rVectors[1];
						//Vector3 mVec = rVectors[0];
						rVectors = calculateNewPositionOfMovementAndEndForUnitTarget(cVec, unit, 20f, timePerFrame,true);		

						Matrix3 current = new Matrix3(((Node)n.realNode).getRotation());
						current = calculateRotationForMovingDirection(rVectors[0], current);
						
						((Node)n.realNode).setRotation(current);//getLocalRotation().set(mVec.x, 0, mVec.z,1);
						
						if (unit.direction==0)
						{
							//unit.startToMoveOneCube(20f, unit.worldX, unit.worldY, unit.worldZ+1, false, false);
							unit.direction=1;
						} else
						if (unit.direction==1)
						{
							//unit.startToMoveOneCube(20f, unit.worldX+1, unit.worldY, unit.worldZ, false, false);
							unit.direction=2;
						} else
						if (unit.direction==2)
						{
							//unit.startToMoveOneCube(20f, unit.worldX, unit.worldY, unit.worldZ-1, false, false);
							unit.direction=3;
						} else
						if (unit.direction==3)
						{
							//unit.startToMoveOneCube(20f, unit.worldX-1, unit.worldY, unit.worldZ, false, false);
							unit.direction=0;
						}
						
					} else
					if (simpleStates.contains(unit.state))
					{
						// simple turn on target and do a single animation, no movement
						
						if (unit.playingAnimation==null)
						{
							if (J3DCore.LOGGING()) Jcrpg.LOGGER.fine("+++++++++++++++++");
							unit.startPlayingAnimation(unit.state, unit.getIdleStateName());
							unit.playingAnimation = unit.state;
						} else
						{
							if (unit.isFinishedPlaying())
							{
								if (J3DCore.LOGGING()) Jcrpg.LOGGER.fine("---------------------");
								unit.playingAnimation = null;
								unit.stateFinished();
								continue;
							} else
							{
								//if (J3DCore.LOGGING()) Jcrpg.LOGGER.fine("STILL PLAYING...");
							}
						}
						
						
						Vector3 cVec = n.getLocalTranslation();
						
						Vector3[] rVectors = calculateNewPositionOfMovementAndEndForUnitTarget(cVec, unit, 20f, timePerFrame,false);		
						//Vector3 eVec = rVectors[1];
						//Vector3 mVec = rVectors[0];
						rVectors = calculateNewPositionOfMovementAndEndForUnitTarget(cVec, unit, 20f, timePerFrame,true);		
						
						Matrix3 current = new Matrix3(((Node)n.realNode).getRotation());
						current = calculateRotationForMovingDirection(rVectors[0], current);
						
						((Node)n.realNode).setRotation(current);//getLocalRotation().set(mVec.x, 0, mVec.z,1);
						
						if (unit.direction==0)
						{
							//unit.startToMoveOneCube(20f, unit.worldX, unit.worldY, unit.worldZ+1, false, false);
							unit.direction=1;
						} else
						if (unit.direction==1)
						{
							//unit.startToMoveOneCube(20f, unit.worldX+1, unit.worldY, unit.worldZ, false, false);
							unit.direction=2;
						} else
						if (unit.direction==2)
						{
							//unit.startToMoveOneCube(20f, unit.worldX, unit.worldY, unit.worldZ-1, false, false);
							unit.direction=3;
						} else
						if (unit.direction==3)
						{
							//unit.startToMoveOneCube(20f, unit.worldX-1, unit.worldY, unit.worldZ, false, false);
							unit.direction=0;
						}
						
					} else
					if (unit.state.equals(MovingModelAnimDescription.ANIM_WALK))
					{
						
						Vector3 cVec = n.getLocalTranslation();

						Vector3[] rVectors = calculateNewPositionOfMovementAndEndForUnitTarget(cVec, unit, unit.movingSpeed, timePerFrame, false);		
						Vector3 eVec = rVectors[1];
						Vector3 mVec = rVectors[0];
						rVectors = calculateNewPositionOfMovementAndEndForUnitTarget(cVec, unit, unit.movingSpeed, timePerFrame, true);		

						n.getLocalTranslation().addLocal(mVec);
						//if (J3DCore.LOGGING()) Jcrpg.LOGGER.fine(unit.c3dX+" "+unit.c3dY+" "+unit.c3dZ);
						((Node)n.realNode).setTranslation(n.getLocalTranslation());

						Matrix3 current = new Matrix3(((Node)n.realNode).getRotation());
						current = calculateRotationForMovingDirection(rVectors[0], current);
						((Node)n.realNode).setRotation(current);//getLocalRotation().set(mVec.x, 0, mVec.z,1);

						double dist = eVec.distance(n.getLocalTranslation());
						//if (J3DCore.LOGGING()) Jcrpg.LOGGER.fine("######### "+dist);
						
						if (dist<0.1f)
						{
							//if (J3DCore.LOGGING()) Jcrpg.LOGGER.fine("TURN");
							unit.endMoveOneCube();
						}
					}
				}
			}
		}
	}
	
	public void setAnimationForRenderedUnit(VisibleLifeForm form, String anim)
	{
		form.renderedUnit.changeToAnimation(anim);
	}
	
	public RenderedMovingUnit materializeLifeForm(VisibleLifeForm form)
	{
		RenderedMovingUnit unit = movingTypeModels.getRenderedUnit(form.type.visibleTypeId).instantiate(this, form.uniqueId, form, form.worldX, form.worldY, form.worldZ);
		unit.onSteep = form.onSteep;
		form.renderedUnit = unit;
		units.put(form.uniqueId, unit);
		return unit;
	}
	
	public void clearAll()
	{
		units.clear();
	}
	
	
	// ======================= private part for 3d calculations... ==========================

	
	/**
	 * Calculates position vector for VisibleLifeForm's position.
	 * @param unit Unit - can be null.
	 * @param target Cannot be null!
	 * @return The position vector.
	 */
	public Vector3 calculatePositionVector(RenderedMovingUnit unit, VisibleLifeForm target, boolean staticCalc)
	{
		double eX = (target.worldX - (core.gameState.getCurrentRenderPositions().origoX))*J3DCore.CUBE_EDGE_SIZE;
		double eY = (target.worldY - (core.gameState.getCurrentRenderPositions().origoY))*J3DCore.CUBE_EDGE_SIZE;
		int origoZ = core.gameState.getCurrentRenderPositions().origoZ;
		int endCoordZCorrect = (origoZ-(target.worldZ-origoZ));
		double eZ = ( endCoordZCorrect - (core.gameState.getCurrentRenderPositions().origoZ) )*J3DCore.CUBE_EDGE_SIZE;
		
		if (unit!=null)
		{
			if (!staticCalc)
			{
				float[] d = (unit.models[0]).disposition;
				
				eY+=d[1]-0.93f;
			}
			
			if (unit.toSteep || staticCalc && unit.onSteep)
			{
				eY+=.5f*J3DCore.CUBE_EDGE_SIZE;
				float[] scale = unit.form.type.getScale();
				// scaling for md5 needs substraction
				eY-=(1-scale[2])*0.4f*J3DCore.CUBE_EDGE_SIZE;
			}
		}
		return new Vector3(eX,eY,eZ);//.normalizeLocal(); // FIX for wrong turnin 2010-04-25
		
	}
	
	/**
	 * Calculates movement disposition for a given time passed based on current position end position and speed. 
	 * @param cVec Current position vector ('world' position)
	 * @param unit The target unit.
	 * @param speed Speed of movement.
	 * @param timePerFrame timePerFrame of 3d engine.
	 * @return array of Vector3 [disposition of movement vector, the end position to reach]  
	 */
	private Vector3[] calculateNewPositionOfMovementAndEndForUnitTarget(Vector3 cVec, RenderedMovingUnit unit, float speed, double timePerFrame, boolean onHorizontalPlane)
	{
		VisibleLifeForm end = unit==null||unit.form==null||unit.form.targetForm==null?playerFakeForm:unit.form.targetForm;
		Vector3 eVec = calculatePositionVector(unit,end,false);
		return calculateNewPositionOfMovementAndEnd(cVec, eVec, speed, timePerFrame,onHorizontalPlane);
	}
	private Vector3[] calculateNewPositionOfMovementAndEndForUnit(Vector3 cVec, RenderedMovingUnit unit, float speed, double timePerFrame, boolean onHorizontalPlane)
	{
		VisibleLifeForm end = unit==null||unit.form==null?playerFakeForm:unit.form;
		Vector3 eVec = calculatePositionVector(unit,end,true);
		return calculateNewPositionOfMovementAndEnd(cVec, eVec, speed, timePerFrame,onHorizontalPlane);
	}
	/**
	 * Calculates movement disposition from a current pos to an end pos for a given speed.
	 * @param cVec current pos
	 * @param eVec end post
	 * @param speed speed
	 * @param timePerFrame timePerFrame of 3d engine.
	 * @return array of Vector3 [disposition of movement vector, the end position to reach]
	 */
	private Vector3[] calculateNewPositionOfMovementAndEnd(Vector3 cVec, Vector3 eVec, float speed, double timePerFrame, boolean onHorizontalPlane)
	{
		if (onHorizontalPlane)
		{
			Vector3 eVN = eVec.clone();
			eVN.setY(0);
			Vector3 cVN = cVec.clone();
			cVN.setY(0);
			return new Vector3[]{eVN.subtract(cVN,null).normalize(null).multiply(speed*10f * 0.1f*timePerFrame,null),eVec};
		} else
		return new Vector3[]{eVec.subtract(cVec,null).normalize(null).multiply(speed*10f * 0.1f*timePerFrame,null),eVec};
	}
	
	private Matrix3 calculateRotationForMovingDirection(Vector3 mVec,Matrix3 current)
	{
		
		Matrix3 rotMat = new Matrix3();
		Vector3 dirOrigo = new Vector3(0f, 0f, 1f);//-1);
		Vector3 left = new Vector3(1, 0, 0);
		Vector3 up = new Vector3(0, 1, 0);

		Vector3 dirNew = mVec;
		dirNew.normalizeLocal();
		rotMat.fromStartEndLocal(dirOrigo, dirNew);
		rotMat.applyPost(left, left);
		rotMat.applyPost(up, up);
		left.normalizeLocal();
		up.normalizeLocal();
		
		//Vector3 m = new Vector3(mVec);
		//m.y=0;
		Quaternion q = new Quaternion();
		q.fromAxes(left,up,dirNew);
		q.normalizeLocal();
		double [] f = q.toEulerAngles(null);
		if (f[0]<-3.09f || f[1]<-3.09f || f[0]>3.10f && f[1]>3.10f)
		{
	        Vector3 axis = new Vector3();
	        double angle = q.toAngleAxis(axis);
	        q.fromAngleNormalAxis(Math.PI + angle, axis);
		} else
		if ( f[0]==0 && f[1]==0 && f[2]>3.14d)
		{
			q.fromEulerAngles(0, f[1]+Math.PI, -f[2]);
		}
		
		Quaternion between = new Quaternion();
		between.fromRotationMatrix(current);
		
		between.slerpLocal(q, 1f);
		Quaternion c = new Quaternion();
		c.fromRotationMatrix(current);
		c.slerpLocal(between, 0.1f);
		c.toRotationMatrix(current);
		return current;//.invertLocal();
	}

	// ================================================================================
	
}
