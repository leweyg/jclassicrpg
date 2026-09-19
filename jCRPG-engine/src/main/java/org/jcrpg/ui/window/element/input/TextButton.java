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

package org.jcrpg.ui.window.element.input;

import java.io.File;
import java.io.IOException;

import org.jcrpg.apps.Jcrpg;
import org.jcrpg.threed.J3DCore;
import org.jcrpg.ui.Window;
import org.jcrpg.ui.mouse.UiMouseEvent;
import org.jcrpg.ui.mouse.UiMouseEvent.UiMouseEventType;
import org.jcrpg.ui.window.InputWindow;

import com.ardor3d.math.ColorRGBA;
import com.ardor3d.scenegraph.Node;
import com.ardor3d.scenegraph.shape.Quad;
import com.ardor3d.util.export.InputCapsule;
import com.ardor3d.util.export.OutputCapsule;

public class TextButton extends InputBase {

	
	boolean NATIVE_FONT_RENDER = true;
	
	public String text;
	public String shortCut;
	
	public static final String defaultImage = "buttonBase.png";
	public String bgImage = defaultImage; 
	public float textProportion = 400f;
	
	boolean centered = true;

	public TextButton(String id, InputWindow w, Node parentNode, float textProportion, String text) {
		super(id, w, parentNode);
		this.text = text;
		this.textProportion = textProportion;
		this.centered = true;
	}
	public TextButton(String id, InputWindow w, Node parentNode, float textProportion, String text, String shortcut) {
		this(id,w,parentNode,textProportion,text);
		w.base.addEventHandler(shortcut, w); // save
		this.shortCut = shortcut;
		this.centered = true;
	}

	public TextButton(String id, InputWindow w, Node parentNode, float textProportion, String text, boolean centered) {
		super(id, w, parentNode);
		this.text = text;
		this.textProportion = textProportion;
		this.centered = centered;
	}
	public TextButton(String id, InputWindow w, Node parentNode, float textProportion, String text, boolean centered, String shortcut) {
		this(id,w,parentNode,textProportion,text,centered);
		w.base.addEventHandler(shortcut, w); // save
		this.shortCut = shortcut;
	}

	public TextButton(String id, InputWindow w, Node parentNode, float centerX, float centerY, float sizeX,
			float sizeY, float textProportion, String text) {
		super(id, w, parentNode, centerX, centerY, sizeX, sizeY);
		this.text = text;
		this.textProportion = textProportion;
		deactivate();
	}
	boolean needBGImage = true;
	public TextButton(String id, InputWindow w, Node parentNode, float centerX, float centerY, float sizeX,
			float sizeY, float textProportion, String text, boolean needBGImage) {
		super(id, w, parentNode, centerX, centerY, sizeX, sizeY);
		this.text = text;
		this.textProportion = textProportion;
		this.needBGImage = needBGImage;
		deactivate();
	}
	public TextButton(String id, InputWindow w, Node parentNode, float centerX, float centerY, float sizeX,
			float sizeY, float textProportion, String text, String shortcut) {
		this(id,w,parentNode,centerX,centerY,sizeX,sizeY,textProportion,text);
		w.base.addEventHandler(shortcut, w); // save
		this.shortCut = shortcut;
	}
	
	Node activeNode = null;
	Node deactiveNode = null;

	@Override
	public void init(float centerX, float centerY, float sizeX, float sizeY) {
		super.init(centerX, centerY, sizeX, sizeY);
		if (baseNode!=null) {
			deactivate(); 
		}
	}

	@Override
	public void activate() {
		activate(false);
	}
	org.jcrpg.ui.BasicText textText = null;
	
	
	public void activate(boolean mouseHover) {
		baseNode.detachAllChildren();
		if (activeNode==null ) {
			activeNode = new Node(""+id);
			//activeNode.setUserData("uiElement", arg1)
			//freeTextNodes();
			if (needBGImage)
			try {
				Quad w1 = Window.loadImageToQuad(new File(bgImage), dSizeX, dSizeY, !centered?dOrigoXCenter*0.95f:dCenterX, dCenterY);
				w1.setSolidColor(ColorRGBA.WHITE);
				activeNode.attachChildAt(w1,0);
			} catch (Exception ex)
			{
				ex.printStackTrace();
			}
			
			if (J3DCore.NATIVE_FONT_RENDER)
			{
				float scale = w.core.getDisplay().getWidth()/textProportion/TEXT_PROP;
				if (textText==null)
				{
					textText = createText(text);
					textText.setScale(scale);
				}
				textText.setTranslation(!centered?dOrigoXCenter*0.95f:textText.getCenterOrigoX(dCenterX,scale), -textText.getHeight2()/2f*scale+ dCenterY,0);
				textText.setTextColor(new ColorRGBA(0.7f,0.7f,0.1f,1f));
			}
		}
		if (J3DCore.NATIVE_FONT_RENDER)
		{
			textText.removeFromParent();
			activeNode.attachChildAt(textText,0);
		}
		baseNode.attachChildAt(activeNode,0);
		if (!mouseHover)
		{
			super.activate();
		}
		baseNode.updateGeometricState(0);
	}

	@Override
	public void deactivate() {
		deactivate(false);
	}

	public void deactivate(boolean mouseHover) {
		baseNode.detachAllChildren();
		if (deactiveNode==null ) {
			deactiveNode = new Node(""+id);
			//freeTextNodes();
			if (needBGImage)
			try {
				Quad w1 = Window.loadImageToQuad(new File(bgImage), dSizeX, dSizeY, !centered?dOrigoXCenter*0.95f:dCenterX, dCenterY);
				w1.setSolidColor(ColorRGBA.GRAY);
				deactiveNode.attachChildAt(w1,0);
			} catch (Exception ex)
			{
				ex.printStackTrace();
			}
			if (J3DCore.NATIVE_FONT_RENDER)
			{
				float scale = w.core.getDisplay().getWidth()/textProportion/TEXT_PROP;
				if (textText==null)
				{
					textText = createText(text);
					textText.setScale(scale);
				}
				textText.setTranslation(!centered?dOrigoXCenter*0.95f:textText.getCenterOrigoX(dCenterX,scale), -textText.getHeight2()/2f*scale+ dCenterY,0);
				textText.setTextColor(new ColorRGBA(0.5f,0.5f,0.1f,1f));
			}
		}
		if (J3DCore.NATIVE_FONT_RENDER)
		{
			textText.removeFromParent();
			deactiveNode.attachChildAt(textText,0);
		}
		baseNode.attachChildAt(deactiveNode,0);
		
		if (!mouseHover)
			{
			super.deactivate();
			}
		baseNode.updateGeometricState(0);
	}

	@Override
	public boolean handleKey(String key) {
		if (key.equals("enter") || shortCut!=null && key.equals(shortCut)) // enter or shortcut
		{
			w.core.audioServer.play(SOUND_INPUTSELECTED);
			w.inputActivated(this);
			w.inputUsed(this, key);
			return true;
		}
		if (J3DCore.LOGGING()) Jcrpg.LOGGER.finest("--- "+id+" "+key);
		return false;
	}

	@Override
	public void reset() {
	}
	
	@Override
	public boolean handleMouse(UiMouseEvent mouseEvent)
	{
		super.handleMouse(mouseEvent);
		if(mouseEvent.getEventType()== UiMouseEventType.MOUSE_PRESSED && mouseEvent.isButtonPressed(UiMouseEvent.BUTTON_LEFT))
        {
    		return handleKey("enter");
        }
		return false;
	}
	
	
	@Override
	public Node getDeactivatedNode() {
		return deactiveNode;
	}
	public void read(InputCapsule capsule) throws IOException {
		// TODO Auto-generated method stub
		
	}
	public void write(OutputCapsule capsule) throws IOException {
		// TODO Auto-generated method stub
		
	}

}
