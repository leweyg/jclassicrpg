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

package org.jcrpg.ui;

import java.io.File;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;

import org.jcrpg.game.logic.ImpactUnit;
import org.jcrpg.threed.J3DCore;
import org.jcrpg.threed.engine.ui.TimedNode;
import org.jcrpg.threed.engine.ui.ZoomingQuad;
import org.jcrpg.threed.input.JClassicRPGClassicControl;
import org.jcrpg.ui.window.InputWindow;
import org.jcrpg.ui.window.element.input.InputBase;
import org.jcrpg.ui.window.element.input.MenuImageButton;
import org.jcrpg.util.Language;
import org.jcrpg.world.ai.EntityMemberInstance;
import org.jcrpg.world.ai.PersistentMemberInstance;
import org.jcrpg.world.ai.abs.state.StateEffect;
import org.jcrpg.world.ai.humanoid.MemberPerson;

import com.ardor3d.bounding.BoundingBox;
import com.ardor3d.math.ColorRGBA;
import com.ardor3d.math.Vector3;
import com.ardor3d.renderer.queue.RenderBucketType;
import com.ardor3d.renderer.state.ColorMaskState;
import com.ardor3d.renderer.state.RenderState.StateType;
import com.ardor3d.scenegraph.Node;
import com.ardor3d.scenegraph.hint.LightCombineMode;
import com.ardor3d.scenegraph.shape.Quad;

public class Characters extends InputWindow {


	
	//FontTT text;
	
	Node node = new Node();
	HUD hud = null;
	ColorMaskState deadColor = null; 
	ColorMaskState neutralColor = null; 
	public Characters(HUD hud)
	{
		super(hud.base);
		deadColor = new ColorMaskState();
		deadColor.setBlue(false);
		deadColor.setGreen(false);
		deadColor.setEnabled(true);

		neutralColor = new ColorMaskState();
		neutralColor.setRed(false);
		neutralColor.setBlue(false);
		neutralColor.setEnabled(true);

		this.hud = hud;
	//	text = FontUtils.textVerdana;
	}
	
	public void hide()
	{
		J3DCore.getInstance().getInputHandler().setSecondaryUIFocusNode(null);
		node.removeFromParent();
	}
	
	public void updateForPartyCreation(ArrayList<PersistentMemberInstance> orderedParty)
	{
		node.detachAllChildren();
		addMembers(orderedParty);
	}
	
	public ArrayList<PersistentMemberInstance> orderedMembers = new ArrayList<PersistentMemberInstance>();
	public ArrayList<Float> effectIconOrigoXPositions = new ArrayList<Float>();
	public ArrayList<Float> effectIconOrigoYPositions = new ArrayList<Float>();
	
	public ArrayList<ArrayList<Quad>> bars = new ArrayList<ArrayList<Quad>>();
	public ArrayList<ArrayList<Double>> barOrigoYPositions = new ArrayList<ArrayList<Double>>();
	
	public static final int BAR_HEALTH = 0; 
	public static final int BAR_STAMINA = 1;
	public static final int BAR_MORALE = 2;
	public static final int BAR_SANITY = 3;
	public static final int BAR_MANA = 4;
	public static final int BAR_MAX= 4;
	
	public static ArrayList<ColorRGBA> pointQuadData = new ArrayList<ColorRGBA>();
	static 
	{
		pointQuadData.add(new ColorRGBA(ColorRGBA.RED));
		pointQuadData.add(new ColorRGBA(ColorRGBA.YELLOW));
		pointQuadData.add(new ColorRGBA(ColorRGBA.GREEN));
		pointQuadData.add(new ColorRGBA(ColorRGBA.ORANGE));
		pointQuadData.add(new ColorRGBA(ColorRGBA.BLUE));
	}
	
	public ArrayList<Node> centerNode = new ArrayList<Node>();
	public ArrayList<Node> deadlyNode = new ArrayList<Node>();
	public ArrayList<Quad> frameQuads = new ArrayList<Quad>();
	public ArrayList<ZoomingQuad> pictureQuads = new ArrayList<ZoomingQuad>();
	
	float barScreenRatio = 13f;
	
	ArrayList<Runnable> globalFontFreers = new ArrayList<Runnable>();
	
	public void addMembers(ArrayList<PersistentMemberInstance> orderedParty)
	{
		orderedMembers.clear();
		bars.clear();
		barOrigoYPositions.clear();
		pictureQuads.clear();
		frameQuads.clear();
		effectIconOrigoXPositions.clear();
		effectIconOrigoYPositions.clear();
		centerNode.clear();
		deadlyNode.clear();
		
		for (Runnable r:globalFontFreers)
		{
			r.run();
		}
		
		try {
			int counter = 0;
			int counterPair = 0;
			int sideYMul = 1, sideYMulFont = 1;
			float sideYBars = 1;
			float stepY = hud.core.getDisplay().getHeight()/5.0f;
			float maxSizeY = hud.core.getDisplay().getHeight()/6.4f;
			float startY = hud.core.getDisplay().getHeight()*0.8f;

			inputs.clear();
			
			for (EntityMemberInstance i:orderedParty)
			{
				if (i.description instanceof MemberPerson)
				{
					orderedMembers.add((PersistentMemberInstance)i);
					MemberPerson p = (MemberPerson)i.description;
					try 
					{
						//SharedMesh sm = new SharedMesh("1",frame);
						Quad sm  = null;
						Node center = null;
						try {
							sm = Window.loadImageToQuad("portraitFrame.png", 1.025f*hud.core.getDisplay().getWidth()/13, 1.037f*hud.core.getDisplay().getHeight()/10.3f, sideYMul*hud.core.getDisplay().getWidth()/20, 0.9988f*startY-stepY*counter);
							sm.setTranslation(sideYMul*hud.core.getDisplay().getWidth()/20, 0.999f*startY-stepY*counterPair,0);
							frameQuads.add(sm);
							Node n = new Node();
							n.setTranslation(sm.getTranslation());
							Node dn = new Node();
							n.attachChildAt(dn,0);
							deadlyNode.add(dn);
							centerNode.add(n);
							center = n;
						} catch (Exception ex)
						{
							
						}
						
						effectIconOrigoXPositions.add(new Float(sideYMul*hud.core.getDisplay().getWidth()/20 - hud.core.getDisplay().getWidth()/(13*2.2f) ));
						effectIconOrigoYPositions.add(new Float(0.999f*startY-stepY*counterPair + hud.core.getDisplay().getHeight()/(10.3f*2.2f)));
						
						ZoomingQuad q = Window.loadImageToZoomingQuad(new File(p.getPicturePath()), hud.core.getDisplay().getWidth()/13, hud.core.getDisplay().getHeight()/10.3f, sideYMul*hud.core.getDisplay().getWidth()/20, startY-stepY*counterPair);
						pictureQuads.add(q);
						Node nametextNode = null;
						Node classtextNode = null;
						Node behaviorTextNode = null;
						if (J3DCore.NATIVE_FONT_RENDER)
						{
							BasicText text = BasicText.createDefaultTextLabel("--", p.foreName);
							text.setTextColor(new ColorRGBA(1,1,0.6f,1f));
							nametextNode = new Node();
							nametextNode.attachChildAt(text,0);
							text.setScale(hud.core.getDisplay().getWidth()/700f/InputBase.TEXT_PROP);
							nametextNode.setTranslation(sideYMulFont*hud.core.getDisplay().getWidth()/50, -hud.core.getDisplay().getWidth()/50+ startY-stepY*(counterPair)-maxSizeY*0.39f,0);

							BasicText text2 = BasicText.createDefaultTextLabel("--", p.professions.get(0).getSimpleName());
							text2.setTextColor(new ColorRGBA(0.5f,0.5f,0.9f,1f));
							classtextNode = new Node();
							classtextNode.attachChildAt(text2,0);
							text2.setScale(hud.core.getDisplay().getWidth()/700f/InputBase.TEXT_PROP);
							classtextNode.setTranslation(sideYMulFont*hud.core.getDisplay().getWidth()/50, -hud.core.getDisplay().getWidth()/50+ startY-stepY*(counterPair)-maxSizeY*0.515f,0);

							BasicText text3 = BasicText.createDefaultTextLabel("--", i.behaviorSkill==null?"-":""+Language.v("skills."+i.behaviorSkill.getClass().getSimpleName()));
							text2.setTextColor(new ColorRGBA(0.5f,0.5f,0.9f,1f));
							behaviorTextNode = new Node();
							behaviorTextNode.attachChildAt(text3,0);
							text3.setScale(hud.core.getDisplay().getWidth()/740f/InputBase.TEXT_PROP);
							behaviorTextNode.setTranslation(sideYMulFont*hud.core.getDisplay().getWidth()/50, -hud.core.getDisplay().getWidth()/50+ startY-stepY*(counterPair)-maxSizeY*0.608f,0);
						} 
						
						nametextNode.getSceneHints().setRenderBucketType(RenderBucketType.Ortho);
						classtextNode.getSceneHints().setRenderBucketType(RenderBucketType.Ortho);
						behaviorTextNode.getSceneHints().setRenderBucketType(RenderBucketType.Ortho);
						
						addNextPointBars(sideYMulFont*hud.core.getDisplay().getWidth()/50+sideYBars*hud.core.getDisplay().getWidth()/13, startY-stepY*(counterPair)-maxSizeY*0.425f + hud.core.getDisplay().getWidth()/(barScreenRatio*2f) , p);
						
	
						node.attachChildAt(nametextNode,0);
						node.attachChildAt(classtextNode,0);
						node.attachChildAt(behaviorTextNode,0);
						
						MenuImageButton b = new MenuImageButton("char"+i.getNumericId(),this,node,counter);
						addInput(b);
						b.baseNode.attachChildAt(sm,0);
						node.attachChildAt(b.baseNode,0);
						node.attachChildAt(q,0);
						node.attachChildAt(center,0);
						sm.setModelBound(new BoundingBox());
						counter ++;
						counterPair = counter / 2;
					} catch (Exception ex)
					{
						ex.printStackTrace();
					}
					if (counter%2==1)
					{
						sideYMul = 19;
						sideYMulFont = 46;
						sideYBars = -0.4f;
					} else
					{
						sideYMul = 1;
						sideYMulFont = 1;
						sideYBars = 1;
					}
					
				}
				
			}
		} catch (Exception ex)
		{
			ex.printStackTrace();
		}
	
	}
	
	public void addNextPointBars(float origoX, double origoY, MemberPerson p)
	{
		ArrayList<Quad> barQuads = new ArrayList<Quad>();
		ArrayList<Double> barPos = new ArrayList<Double>();
		for (int i=0; i<=BAR_MAX; i++)
		{
			try {
				Quad q = Window.loadImageToQuad(new File("/bar_meter.png"), hud.core.getDisplay().getWidth()/230f, hud.core.getDisplay().getHeight()/barScreenRatio, 0,0);
				//Quad q = new Quad("BAR_"+i+p.foreName+p.surName,hud.core.getDisplay().getWidth()/230f,);
				q.setSolidColor(pointQuadData.get(i));
				q.getSceneHints().setLightCombineMode(LightCombineMode.Off);
				q.setTranslation(origoX+i*hud.core.getDisplay().getWidth()/230f,origoY,0f);
				q.setScale(1f);
				barPos.add(origoY);
				barQuads.add(q);
			} catch (Exception ex){ex.printStackTrace();}
		}
		bars.add(barQuads);
		barOrigoYPositions.add(barPos);
	}
	
	public void updatePoints()
	{
		updatePoints(null);
	}
	
	private HashMap<EntityMemberInstance, HashSet<Quad>> membersAndEffectIcons = new HashMap<EntityMemberInstance, HashSet<Quad>>();	
	
	public void updateEffectIcons(EntityMemberInstance member)
	{
		if (hud.core.gameLost == true || hud.core.gameState==null || hud.core.gameState.player==null || hud.core.gameState.player.orderedParty==null) 
		{
			return;
		}
		int counter = 0;
		
		//if (bars.size()!=0)
		for (EntityMemberInstance p:hud.core.gameState.player.orderedParty)
		{
			if (member!=null && member!=p) {
				counter++;
				continue;
			}
			
			HashSet<String> iconsAlreadyAdded = new HashSet<String>();
			
			HashSet<Quad> quads = membersAndEffectIcons.get(p);
			if (quads!=null)
			{
				for (Quad q:quads)
				{
					q.removeFromParent();
				}
				quads.clear();
			} else
			{
				quads = new HashSet<Quad>();
				membersAndEffectIcons.put(p, quads);
			}
			
			float origoX = effectIconOrigoXPositions.get(counter);
			float origoY = effectIconOrigoYPositions.get(counter);
			
			float iconSize = hud.core.getDisplay().getWidth()/60f;
			float iconPlacing = iconSize*1.1f;
			
			int count = 0;
			for (StateEffect effect:p.memberState.getStateEffects())
			{
				String file = effect.getIconFilePath();
				if (iconsAlreadyAdded.contains(file)) continue;
				Quad sm  = null;
				try {
					iconsAlreadyAdded.add(file);
					sm = Window.loadImageToQuad(new File(file), iconSize, iconSize, origoX+ count*iconPlacing, origoY);
					quads.add(sm);
					node.attachChildAt(sm,0);
				} catch (Exception ex)
				{
					ex.printStackTrace();
				}
				count++;
			}
		}		
	}
	
	public void updatePoints(EntityMemberInstance member)
	{
		if (hud.core.gameLost == true || hud.core.gameState==null || hud.core.gameState.player==null || hud.core.gameState.player.orderedParty==null) 
		{
			return;
		}

		int counter = 0;
		
		if (bars.size()!=0)
		for (EntityMemberInstance p:hud.core.gameState.player.orderedParty)
		{
			if (member!=null && member!=p) {
				counter++;
				continue;
			}
			//if (J3DCore.LOGGING()) Jcrpg.LOGGER.finest("UPDATE ____________ "+p);
			float multiplierHealth = p.memberState.maxHealthPoint==0?0.0001f:Math.max(0f,p.memberState.healthPoint*1f)/p.memberState.maxHealthPoint; 
			float multiplierStamina = p.memberState.maxStaminaPoint==0?0.0001f:Math.max(0f,p.memberState.staminaPoint*1f)/p.memberState.maxStaminaPoint;
			float multiplierMorale = p.memberState.maxMoralePoint==0?0.0001f:Math.max(0f,p.memberState.moralePoint*1f)/p.memberState.maxMoralePoint;
			float multiplierSanity = p.memberState.maxSanityPoint==0?0.0001f:Math.max(0f,p.memberState.sanityPoint*1f)/p.memberState.maxSanityPoint;
			float multiplierMana = p.memberState.maxManaPoint==0?0.0001f:Math.max(0f,p.memberState.manaPoint*1f)/p.memberState.maxManaPoint;
			
			if (p.isDead())
			{
				Quad q= pictureQuads.get(counter);				
				q.setRenderState(deadColor);
				try
				{
					Quad dead = Window.loadImageToQuad(new File("/characters/skull.png"), hud.core.getDisplay().getWidth()/barScreenRatio, hud.core.getDisplay().getHeight()/barScreenRatio, 0,0);
					Node n = deadlyNode.get(counter);
					n.detachAllChildren();
					n.attachChildAt(dead,0);
				} catch (Exception ex)
				{
				}
			} else
			if (p.memberState.isNeutralized())
			{
				Quad q= pictureQuads.get(counter);				
				q.setRenderState(neutralColor);
				try
				{
					Quad dead = Window.loadImageToQuad(new File("/characters/neutral.png"), hud.core.getDisplay().getWidth()/barScreenRatio, hud.core.getDisplay().getHeight()/barScreenRatio, 0,0);
					Node n = deadlyNode.get(counter);
					n.detachAllChildren();
					n.attachChildAt(dead,0);
				} catch (Exception ex)
				{
				}
			} else
			{
				Quad q= pictureQuads.get(counter);
				q.clearRenderState(StateType.ColorMask);//clearRenderState(RenderState.RS_COLORMASK_STATE);
			}
			highlightCharacter(p, false);
		
			float[] mul = new float[] {multiplierHealth,multiplierStamina,multiplierMorale,multiplierSanity,multiplierMana};
			
			ArrayList<Quad> m = bars.get(counter);
			ArrayList<Double> pos = barOrigoYPositions.get(counter);
			for (int i=0; i<=BAR_MAX; i++)
			{
				//if (J3DCore.LOGGING()) Jcrpg.LOGGER.finest(m.get(i));
				m.get(i).setScale(new Vector3(1f,mul[i]*1f,1f));
				m.get(i).removeFromParent();
				Double origoY = pos.get(i);
				if (mul[i]!=0) {
					Vector3 t = new Vector3(m.get(i).getTranslation());
					t.setY(origoY - ( (hud.core.getDisplay().getHeight()/(barScreenRatio*2d)) * (1d - mul[i]) ));
					m.get(i).setTranslation(t);
				}
				node.attachChildAt(m.get(i),0);
			}
			counter++;
		}
	}
	
	public void highlightCharacter(EntityMemberInstance member, boolean highlightOn)
	{
		//if (J3DCore.LOGGING()) Jcrpg.LOGGER.finest("//# HIGHLIGHTING: "+member.description.getName()+" "+highlightOn);
		int counter = 0;
		for (EntityMemberInstance p:hud.core.gameState.player.orderedParty)
		{
			if (p==member)
			{
				ZoomingQuad q= pictureQuads.get(counter);				
				Quad fq= frameQuads.get(counter);
				if (highlightOn)
				{
					q.setSolidColor(ColorRGBA.ORANGE);
					fq.setSolidColor(ColorRGBA.RED);
					q.startZoomCycle();
				} else
				{
					q.setSolidColor(ColorRGBA.WHITE);
					fq.setSolidColor(ColorRGBA.WHITE);
				}
			}
			counter++;
		}		
	}
	
	public void zoomOnCharacter(EntityMemberInstance member)
	{
		int counter = 0;
		for (EntityMemberInstance p:hud.core.gameState.player.orderedParty)
		{
			if (p==member)
			{
				ZoomingQuad q= pictureQuads.get(counter);				
				q.startZoomCycle();
			}
			counter++;
		}		
	}
	
	ColorRGBA targetColor = new ColorRGBA(0.9f,0.5f,0.5f,1f);

	public void targetCharacter(EntityMemberInstance member, boolean highlightOn)
	{
		//if (J3DCore.LOGGING()) Jcrpg.LOGGER.finest("//# TARGET HIGHLIGHTING: "+member.description.getName()+" "+highlightOn);
		int counter = 0;
		for (EntityMemberInstance p:hud.core.gameState.player.orderedParty)
		{
			if (p==member)
			{
				ZoomingQuad q= pictureQuads.get(counter);				
				Quad fq= frameQuads.get(counter);
				if (highlightOn)
				{
					q.setSolidColor(targetColor);
					fq.setSolidColor(ColorRGBA.RED);
					q.startZoomCycle();
				} else
				{
					q.setSolidColor(ColorRGBA.WHITE);
					fq.setSolidColor(ColorRGBA.WHITE);
				}
			}
			counter++;
		}		
	}

	public void update()
	{ 
		node.detachAllChildren();
		addMembers(hud.core.gameState.player.orderedParty);
		updatePoints();
	}
	
	/**
	 * Used when party creation. 
	 */
	public void showNoPointUpdate()
	{
		hud.hudNode.attachChildAt(node,0);
	}

	public void show()
	{
		updatePoints();
		hud.hudNode.attachChildAt(node,0);
		J3DCore.getInstance().getInputHandler().setSecondaryUIFocusNode(hud.hudNode);
	}
	
	public void visualizeImpact(EntityMemberInstance member, ImpactUnit u)
	{
		int count = 0;
		for (EntityMemberInstance p:hud.core.gameState.player.orderedParty)
		{
			if (p==member)
			{
				Node center = centerNode.get(count);
				
				Node n = new Node();
				int counter = 0;
				int addedCounter = 0;
				ArrayList<Runnable> freers = new ArrayList<Runnable>();
				for (Integer i:u.orderedImpactPoints)
				{
					if (i!=null && i!=0)
					{
						//if (J3DCore.LOGGING()) Jcrpg.LOGGER.finest("_#_#_#_ VISUALIZING "+member.description.getName()+" "+counter+" = "+i);
						ColorRGBA color = Characters.pointQuadData.get(counter);
						Node slottextNode = new Node();// TODO ardor3d FontUtils.textNonBoldVerdana.createOutlinedText(""+i, 1,color,new ColorRGBA(0.8f,0.8f,0.8f,1f),true);
						BasicText text = BasicText.createDefaultTextLabel("", ""+i);
						text.setSolidColor(color);
						slottextNode.attachChildAt(text, 0);
						//freers.add(new NodeFontFreer(FontUtils.textNonBoldVerdana,slottextNode));
						slottextNode.setTranslation(0,0,0);
						slottextNode.getSceneHints().setRenderBucketType(RenderBucketType.Ortho);
						text.setScale(hud.core.getDisplay().getWidth()/30d*0.17d*0.25d);
						n.attachChildAt(slottextNode,0);
						addedCounter++;
					}
					counter++;
				}
				n.setTranslation(new Vector3(0f,0f,0f));
				//n.setLocalScale(0.17f);
				TimedNode fn = new TimedNode();
				fn.onFinish = freers;
				fn.attachChildAt(n,0);
				center.attachChildAt(fn,0);	
				fn.startCounting();
				
			}
			count ++;
		}
	}

	@Override
	public boolean inputChanged(InputBase base, String message) {
		// TODO Auto-generated method stub
		return false;
	}

	@Override
	public boolean inputEntered(InputBase base, String message) {
		return false;
	}

	@Override
	public boolean inputLeft(InputBase base, String message) {
		// TODO Auto-generated method stub
		return false;
	}

	@Override
	public boolean inputUsed(InputBase base, String message) {
		if (base instanceof MenuImageButton)
		{
			int v = ((MenuImageButton) base).selectedValue;
			PersistentMemberInstance i = orderedMembers.get(v);
			if (message.equals("enter"))
			{
				core.getClassicInputHandler().characterSelected(v, i, JClassicRPGClassicControl.PRIMARY_INPUT_TYPE);
			} else
			if (message.equals("right"))
			{
				core.getClassicInputHandler().characterSelected(v, i, JClassicRPGClassicControl.SECONDARY_INPUT_TYPE);
			}
		}
		return false;
	}
	
	
}
