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

package org.jcrpg.ui;

import java.util.ArrayList;

import org.jcrpg.threed.J3DCore;
import org.jcrpg.threed.engine.ui.FlyingNode;
import org.jcrpg.ui.map.LocalMap;
import org.jcrpg.ui.meter.DirectionTimeMeter;
import org.jcrpg.ui.meter.EntityOMeter;
import org.jcrpg.ui.text.TextBox;
import org.jcrpg.ui.text.TextEntry;
import org.jcrpg.world.ai.EntityMemberInstance;

import com.ardor3d.image.Texture;
import com.ardor3d.image.Texture.MinificationFilter;
import com.ardor3d.math.ColorRGBA;
import com.ardor3d.math.Vector3;
import com.ardor3d.renderer.queue.RenderBucketType;
import com.ardor3d.renderer.state.BlendState;
import com.ardor3d.renderer.state.TextureState;
import com.ardor3d.scenegraph.Node;
import com.ardor3d.scenegraph.hint.LightCombineMode;
import com.ardor3d.scenegraph.shape.Quad;
import com.ardor3d.util.TextureManager;
import com.ardor3d.util.resource.ResourceLocatorTool;

public class HUD {

	public Node hudNode;
	
	public UIBase base;
	public J3DCore core;
	
	public HUDParams params;
	
	public BlendState hudAS;
	public DirectionTimeMeter meter;
	public SystemRelated sr;
	public TextBox mainBox;
	public Characters characters;
	public LocalMap localMap;
	public EntityOMeter entityOMeter;
	
	public HUD(HUDParams params, UIBase base, J3DCore core) throws Exception
	{
		this.params = params;
		this.base = base;
		this.core = core;
		initNodes();
		
		
	}
	Quad mapQuad;
	
	/**
	 * Used for reinitializing too when gamestate is ready.
	 */
	public void initGameStateNodes()
	{
        // world map area
        
		float dispY = 1.12f;
		float dispX = 1.1f;
		float sizeY = 1.05f;
		float sizeX = 1.05f;
        if (mapQuad!=null) mapQuad.removeFromParent();
        mapQuad = new Quad("hud", (1f/sizeX) * core.getDisplay().getWidth()/12, (1f/sizeY) *(core.getDisplay().getHeight()/9));
        mapQuad.getSceneHints().setRenderBucketType(RenderBucketType.Ortho);  
        mapQuad.setTranslation(new Vector3(core.getDisplay().getWidth() - dispX*(core.getDisplay().getWidth()/24),dispY*(core.getDisplay().getHeight()/18),0));
        mapQuad.getSceneHints().setLightCombineMode(LightCombineMode.Off);
        localMap = new LocalMap(core.gameState.world, core.renderedArea);
        localMap.registerQuad(mapQuad);
        mapQuad.setRenderState(hudAS);
        hudNode.attachChildAt(mapQuad,0);
 
	}
	
	public void initNodes() throws Exception
	{
        hudNode = new Node("hudNode");

        // main hud image area
        
        Quad hudQuad = new Quad("hud", core.getDisplay().getWidth(), (core.getDisplay().getHeight()/7.0f));
        hudQuad.getSceneHints().setRenderBucketType(RenderBucketType.Ortho);  

        hudQuad.setTranslation(new Vector3(core.getDisplay().getWidth()/2,core.getDisplay().getHeight()/14f,0));
 
		
		Texture texture = TextureManager.load(ResourceLocatorTool.locateResource(UIBase.RES_TYPE_UI, params.image), MinificationFilter.BilinearNearestMipMap,  true);

        TextureState state = new TextureState();
        state.setTexture(texture);
        hudQuad.setRenderState(state);

        hudAS = new BlendState();
        hudAS.setBlendEnabled(true);
  
        hudAS.setSourceFunction( BlendState.SourceFunction.SourceAlpha);
        hudAS.setDestinationFunction( BlendState.DestinationFunction.OneMinusSourceAlpha);
        hudAS.setTestEnabled(false);
        hudAS.setEnabled(true);
        hudQuad.setRenderState(hudAS);
        hudNode.attachChildAt(hudQuad,0);

        // meter area
        
        meter = new DirectionTimeMeter(this);
        hudNode.attachChildAt(meter.quad_sign_sun,0);
        hudNode.attachChildAt(meter.quad_sign_dir,0);
        //hudNode.attachChildAt(meter.quad);
        
        // system
        sr = new SystemRelated(this,new String[]{"LOAD","DICE","CAMPFIRE", "ECONOMY"},new String[]{"hourglass_zphr.png","dice_zphr.png","campfire.png","economic.png"});
        
        // main textbox
        
        mainBox = new TextBox(this,"Main",0.080f,0.114f,0.3f,0.13f);
        mainBox.show();
        mainBox.addEntry(new TextEntry("jClassicRPG pre-alpha version, code is LGPL",new ColorRGBA(ColorRGBA.ORANGE)));
        //mainBox.addEntry(new TextEntry("Use keyboard in the menus",ColorRGBA.orange));
        base.addEventHandler("logUp", mainBox);
        base.addEventHandler("logDown", mainBox);
        
        characters = new Characters(this);
        
        entityOMeter = new EntityOMeter(this);
        
		
	}
	
	public void update()
	{
	}
	
	public void updateCharacterRelated(EntityMemberInstance instance)
	{
		characters.updatePoints(instance);
	}
	FlyingNode lastOSDText = null;
	public void startFloatingOSDText(String text, ColorRGBA color)
	{
		float y = J3DCore.getInstance().getDisplay().getHeight()/1.6f;
		if (lastOSDText!=null) 
		{
			if (!lastOSDText.isFinishedPlaying())
			{
				y = y*0.9f;
			}
		}
		FlyingNode node = new FlyingNode();
		lastOSDText = node;
		BasicText t = BasicText.createDefaultTextLabel("floating", text);
		t.setSolidColor(color);
		BasicText t2 = BasicText.createDefaultTextLabel("floating", text);
		t2.setSolidColor(ColorRGBA.BLACK);
		ArrayList<Runnable> onFinish = new ArrayList<Runnable>();
		node.onFinish = onFinish;
		t.getSceneHints().setRenderBucketType(RenderBucketType.Ortho);
		t.setScale(core.getDisplay().getWidth()/600f);		
		t2.getSceneHints().setRenderBucketType(RenderBucketType.Ortho);
		t2.setScale(core.getDisplay().getWidth()/595f);		
		node.setTranslation(J3DCore.getInstance().getDisplay().getWidth()/2f-t.getWidth()/2f*core.getDisplay().getWidth()/600f,y,0f);
		node.attachChildAt(t2,0);
		node.attachChildAt(t,0);
		hudNode.attachChildAt(node,0);
		node.startFlying(8f,3.0f);
	}
	
}
