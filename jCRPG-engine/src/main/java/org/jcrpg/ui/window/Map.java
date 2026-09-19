/*
 *  This file is part of JavaCRPG.
 *  Copyright (C) 2007 Illes Pal Zoltan
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

package org.jcrpg.ui.window;

import java.io.IOException;
import java.util.HashMap;
import java.util.HashSet;

import org.jcrpg.threed.J3DCore;
import org.jcrpg.ui.UIBase;
import org.jcrpg.ui.map.WorldMap;
import org.jcrpg.ui.map.WorldMap.LabelContainer;
import org.jcrpg.ui.map.WorldMap.LabelDesc;
import org.jcrpg.ui.mouse.UiMouseEvent;
import org.jcrpg.ui.mouse.UiMouseEvent.UiMouseEventType;
import org.jcrpg.ui.window.element.TextLabel;
import org.jcrpg.ui.window.element.input.InputBase;
import org.jcrpg.ui.window.element.input.TextButton;
import org.jcrpg.util.Language;

import com.ardor3d.bounding.BoundingBox;
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
import com.ardor3d.util.export.InputCapsule;
import com.ardor3d.util.export.OutputCapsule;
import com.ardor3d.util.resource.ResourceLocatorTool;

public class Map extends InputWindow {

	public WorldMap wmap;
	
	TextButton closeWindow;
	
	TextLabel worldTime = null;
	TextLabel labelDesc = null;
	
	public class MapQuad extends InputBase
	{

		public MapQuad(String id, InputWindow w, Node parentNode) {
			super(id, w, parentNode);
		}

		@Override
		public Node getDeactivatedNode() {
			return null;
		}

		@Override
		public void reset() {
		}
		
		public String tooltip = null;
		
		public boolean handleMouse(UiMouseEvent mouseEvent)
		{
			if (mouseEvent.getEventType()==UiMouseEventType.MOUSE_EXITED)
			{
				w.inputLeft(this, "");
			}
			if (mouseEvent.getEventType()==UiMouseEventType.MOUSE_MOVED)
			{
				double rX = mouseEvent.getPickedSpatialList().get(0).ratioX;
				double rY = mouseEvent.getPickedSpatialList().get(0).ratioY;
				String[] v = mouseHover(rX, rY);
				if (v==null)
				{
					tooltip = null;
				} else
				{
					tooltip = v[1];
					
				}
			}
			toggleTooltip(getTooltipText());
			return true;
		}

		@Override
		public String getTooltipText() {
			if (tooltip==null)
				return super.getTooltipText();
			return tooltip;
		}

		public void read(InputCapsule capsule) throws IOException {
			// TODO Auto-generated method stub
			
		}

		public void write(OutputCapsule capsule) throws IOException {
			// TODO Auto-generated method stub
			
		}
		
		

		
	}
	
	HashMap<String, LabelDesc> labelsToCoordinates = new HashMap<String, LabelDesc>();
	
	public Map(UIBase base, WorldMap wmap) throws Exception {
		super(base);
		this.wmap = wmap;
        // main hud image area

		BlendState hudAS = base.hud.hudAS;
        //AlphaState hudAS = core.getDisplay().getRenderer().createAlphaState();
        //hudAS.setBlendEnabled(true);
  
/*        hudAS.setSrcFunction(AlphaState.SB_SRC_ALPHA);
        hudAS.setDstFunction(AlphaState.DB_ONE_MINUS_SRC_ALPHA);
        hudAS.setTestEnabled(false);
        hudAS.setEnabled(true);*/
        
        TextureState frameState= new TextureState();
        String fileName = "windowframe.dds";
        if (J3DCore.SETTINGS.DISABLE_DDS)
        {
        	fileName = "windowframe.png";     	
        }
        Texture frameTex = TextureManager.load(ResourceLocatorTool.locateResource(UIBase.RES_TYPE_UI, fileName), MinificationFilter.BilinearNearestMipMap,  true);
        frameState.setTexture(frameTex);
        float widthRatio = 6.0f;
        float heightRatio = 7.4f;
        float heightDiv = 1.8f;
        {
        	Quad hudQuad = new Quad("hud", (int)((core.getDisplay().getWidth()/10)*widthRatio*1.06f), (int)(((core.getDisplay().getHeight()/10)*heightRatio*1.06f)));
	        hudQuad.getSceneHints().setRenderBucketType(RenderBucketType.Ortho);  
	        hudQuad.setTranslation(new Vector3(core.getDisplay().getWidth()/2,core.getDisplay().getHeight()/heightDiv,0));
			
	        hudQuad.setRenderState(frameState);
	        hudQuad.setRenderState(hudAS);
	        windowNode.attachChildAt(hudQuad,0);
	        
        }
        
        TextureState[] textureStates = wmap.getMapTextures();
        {
        	Quad hudQuad = new Quad("hud", (core.getDisplay().getWidth()/10)*widthRatio, ((core.getDisplay().getHeight()/10)*heightRatio));
	        hudQuad.getSceneHints().setRenderBucketType(RenderBucketType.Ortho);  
	        hudQuad.setTranslation(new Vector3(core.getDisplay().getWidth()/2,core.getDisplay().getHeight()/heightDiv,0));
			
	        hudQuad.setRenderState(textureStates[0]);
	        windowNode.attachChildAt(hudQuad,0);
	        hudQuad.setRenderState(hudAS);
        }
        
        
        {
        	Quad hudQuad = new Quad("hud_geo", (core.getDisplay().getWidth()/10)*widthRatio, ((core.getDisplay().getHeight()/10)*heightRatio));
	        hudQuad.getSceneHints().setRenderBucketType(RenderBucketType.Ortho);  
	        hudQuad.setTranslation(new Vector3(core.getDisplay().getWidth()/2,core.getDisplay().getHeight()/heightDiv,0));
			
	        hudQuad.setRenderState(textureStates[2]);
	        windowNode.attachChildAt(hudQuad,0);
	        hudQuad.setRenderState(hudAS);
        }
        {
        	Quad hudQuad = new Quad("hud_pos", (core.getDisplay().getWidth()/10)*widthRatio, ((core.getDisplay().getHeight()/10)*heightRatio));
	        hudQuad.getSceneHints().setRenderBucketType(RenderBucketType.Ortho);  
	        hudQuad.getSceneHints().setLightCombineMode(LightCombineMode.Off);
	        hudQuad.setTranslation(new Vector3(core.getDisplay().getWidth()/2,core.getDisplay().getHeight()/heightDiv,0));
	        wmap.registerQuad(hudQuad);
	        windowNode.attachChildAt(hudQuad,0);
	        hudQuad.setRenderState(hudAS);
	        
	        MapQuad mapQuad = new MapQuad("-",this,windowNode);
	        hudQuad.setModelBound(new BoundingBox());
	        mapQuad.baseNode.attachChildAt(hudQuad,0);
			mapQuad.globalTooltip=(Language.v("map.globalTooltip"));
        }
        
        LabelContainer labelContainer = wmap.getLabels();
        
        
        float xRatio = 0.586f / J3DCore.getInstance().gameState.world.sizeX;
        float yRatio = 0.717f / J3DCore.getInstance().gameState.world.sizeZ;
        float offsetX = 0.21f;
        float offsetY = 0.092f;
		//TextLabel tlc1 = new TextLabel("1",this,windowNode,0 * 0.01f+offsetX, 0 * 0.01f+offsetY, 0.3f, 0.05f, 700, "xxxx",false);
		//TextLabel tlc2 = new TextLabel("2",this,windowNode,J3DCore.getInstance().gameState.world.sizeX * xRatio+offsetX, J3DCore.getInstance().gameState.world.sizeZ * yRatio +offsetY, 0.3f, 0.05f, 700, "xxxx",false);

        HashSet<String> displayedAlready = new HashSet<String>();
        for (LabelDesc townDesc : labelContainer.towns)
        {
        	
        	String key = townDesc.x+"|"+townDesc.z;
        	labelsToCoordinates.put(key, townDesc);
        	if (displayedAlready.contains(townDesc.text))
        	{
        	} else
        	{
        		displayedAlready.add(townDesc.text);
	        	if (townDesc.scale1>1)
	        	{
	           		TextLabel tl = new TextLabel(""+townDesc.text,this,windowNode,townDesc.x * xRatio+offsetX+ xRatio*0.03f, (J3DCore.getInstance().gameState.world.sizeZ-townDesc.z) * yRatio + offsetY + yRatio*0.03f, 0.0f, 0.05f, 600, lS(townDesc.text),false,false, new ColorRGBA(ColorRGBA.BLACK));
	           		TextLabel tl2 = new TextLabel(""+townDesc.text,this,windowNode,townDesc.x * xRatio+offsetX, (J3DCore.getInstance().gameState.world.sizeZ-townDesc.z) * yRatio + offsetY, 0.0f, 0.05f, 600, lS(townDesc.text),false,false, new ColorRGBA(ColorRGBA.WHITE));
	        	}
        	}
        	/*if (townDesc.scale1==1)
        	{
        		TextLabel tl = new TextLabel(""+townDesc.text,this,windowNode,townDesc.x * xRatio+offsetX, (J3DCore.getInstance().gameState.world.sizeZ-townDesc.z) * yRatio + offsetY, 0.3f, 0.05f, 1100, lS(townDesc.text),false,false, ColorRGBA.white);
        	}*/
        }
        
        
        worldTime = new TextLabel("time",this,windowNode,0.5f, 0.051f, 0.25f, 0.041f,600f,"time__________",true);
        //labelDesc = new TextLabel("labelDesc",this,windowNode,0.5f, 0.838f, 0.25f, 0.041f,600f,"",true);
        
    	closeWindow = new TextButton("close",this,windowNode, 0.81f, 0.071f, 0.013f, 0.031f,800f,"x");
    	addInput(closeWindow);
    	
	}

	public String lS(String s)
	{
		if (s.length()>5)
		{
			return s.substring(0,5)+"."; 
		}
		return s;
	}
	
	@Override
	public void hide() {
		toggleTooltip(null);
		core.getUIRootNode().detachChild(windowNode);
	}

	@Override
	public void show() {
    	updateTime();
		core.getUIRootNode().attachChildAt(windowNode,0);
		wmap.wasShownAtLeastOnce = true;
		toggleTooltip(Language.v("map.globalTooltip"));
	}

	@Override
	public boolean inputChanged(InputBase base, String message) {
		return false;
	}

	@Override
	public boolean inputEntered(InputBase base, String message) {
		return false;
	}

	@Override
	public boolean inputLeft(InputBase base, String message) {
    	updateTime();
		return false;
	}

	@Override
	public boolean inputUsed(InputBase base, String message) {
		if (base == closeWindow)
		{
			toggle();
			return true;
		}
		return true;
	}
	
	public String[] mouseHover(double x, double y)
	{
		int blockX, blockY;
		blockX = (int)(x*wmap.world.sizeX);
		blockY = (int)((1f-y)*wmap.world.sizeZ);
		
    	String key = blockX+"|"+blockY;
    	LabelDesc desc = labelsToCoordinates.get(key);
    	if (desc!=null)
    	{
    		worldTime.text = desc.text;
    		worldTime.setUpdated(true);
    		worldTime.activate();
    		return new String[]{desc.text,desc.text+", size: "+desc.scale1+" District: "+desc.type1+" Owner: "+(desc.type2==null?"-":desc.type2)};
    	}

    	updateTime();
    	
    	return null;

	}
	
	private void updateTime()
	{
		worldTime.text = core.gameState.engine.getWorldMeanTime().toReadableString();
		worldTime.setUpdated(true);
		worldTime.activate();

	}

}
