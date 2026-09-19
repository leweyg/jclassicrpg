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

/**
 * Image button - button with text and/or a given image.
 * @author illes
 *
 */
public class ImageButton extends InputBase {

	public String text;
	public String shortCut;
	
	public static final String defaultImage = "buttonBase.png";
	public String bgImage = defaultImage; 
	public float textProportion = 400f;
	
	boolean centered = true;
	

	public ImageButton(final String id, final InputWindow w, final Node parentNode, final float textProportion, final String text, final String image) {
		super(id, w, parentNode);
		this.text = text;
		this.bgImage = image;
		this.textProportion = textProportion;
		this.centered = true;
	}
	public ImageButton(final String id, final InputWindow w, final Node parentNode, final float textProportion, final String text, final String shortcut, final String image) {
		this(id,w,parentNode,textProportion,text,image);
		w.base.addEventHandler(shortcut, w); // save
		this.shortCut = shortcut;
		this.centered = true;
	}

	public ImageButton(final String id, final InputWindow w, final Node parentNode, final float textProportion, final String text, final boolean centered, final String image) {
		super(id, w, parentNode);
		this.bgImage = image;
		this.text = text;
		this.textProportion = textProportion;
		this.centered = centered;
	}
	public ImageButton(final String id, final InputWindow w, final Node parentNode, final float textProportion, final String text, final boolean centered, final String shortcut, final String image) {
		this(id,w,parentNode,textProportion,text,centered,image);
		w.base.addEventHandler(shortcut, w); // save
		this.shortCut = shortcut;
	}

	public ImageButton(final String id, final InputWindow w, final Node parentNode, final float centerX, final float centerY, final float sizeX,
			final float sizeY, final float textProportion, final String text, final String image) {
		super(id, w, parentNode, centerX, centerY, sizeX, sizeY);
		this.text = text;
		this.bgImage = image;
		this.textProportion = textProportion;
		deactivate();
	}
	public ImageButton(final String id, final InputWindow w, final Node parentNode, final float centerX, final float centerY, final float sizeX,
			final float sizeY, final float textProportion, final String text, final String shortcut, final String image) {
		this(id,w,parentNode,centerX,centerY,sizeX,sizeY,textProportion,text,image);
		w.base.addEventHandler(shortcut, w); // save
		this.shortCut = shortcut;
	}
	
	Node activeNode = null;
	Node deactiveNode = null;

	@Override
	public void init(final float centerX, final float centerY, final float sizeX, final float sizeY) {
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

	public void activate(final boolean mouseHover) {
		baseNode.detachAllChildren();
		if (activeNode==null ) {
			activeNode = new Node(""+id);
			//activeNode.setUserData("uiElement", arg1)
			//freeTextNodes();
			try {
				final Quad w1 = Window.loadImageToQuad(bgImage, dSizeX, dSizeY, !centered?dOrigoXCenter*0.95f:dCenterX, dCenterY);
				w1.setSolidColor(ColorRGBA.WHITE);
				activeNode.attachChildAt(w1,0);
			} catch (final Exception ex)
			{
				ex.printStackTrace();
			}
			
			if (J3DCore.NATIVE_FONT_RENDER)
			{
				final float scale = w.core.getDisplay().getWidth()/textProportion/TEXT_PROP;
				if (textText==null)
				{
					textText = createText(text);
					textText.setScale(scale);
				}
				textText.setTranslation(!centered?dOrigoX:textText.getCenterOrigoX(dCenterX,scale), -textText.getHeight2()/2f*scale+ dCenterY,0);
				activeNode.attachChildAt(textText,0);
				textText.setTextColor(new ColorRGBA(0.7f,0.7f,0.1f,1f));
			}
		}
		baseNode.attachChildAt(activeNode,0);

		if (!mouseHover)
		{
			super.activate();
		}
	}

	@Override
	public void deactivate() {
		deactivate(false);
	}

	public void deactivate(final boolean mouseHover) {
		baseNode.detachAllChildren();
		if (deactiveNode==null ) {
			deactiveNode = new Node(""+id);
			//freeTextNodes();
			try {
				final Quad w1 = Window.loadImageToQuad(bgImage, dSizeX, dSizeY, !centered?dOrigoXCenter*0.95f:dCenterX, dCenterY);
				w1.setSolidColor(ColorRGBA.GRAY);
				deactiveNode.attachChildAt(w1,0);
			} catch (final Exception ex)
			{
				ex.printStackTrace();
			}
			if (J3DCore.NATIVE_FONT_RENDER)
			{
				final float scale = w.core.getDisplay().getWidth()/textProportion/TEXT_PROP;
				if (textText==null)
				{
					textText = createText(text);
					textText.setScale(scale);
				}
				textText.setTranslation(!centered?dOrigoX:textText.getCenterOrigoX(dCenterX,scale), -textText.getHeight2()/2f*scale+dCenterY,0);
				deactiveNode.attachChildAt(textText,0);
				textText.setTextColor(new ColorRGBA(0.5f,0.5f,0.1f,1f));
			} 
		}
		baseNode.attachChildAt(deactiveNode,0);
		
		if (!mouseHover)
			{
			super.deactivate();
			}
	}

	@Override
	public boolean handleKey(final String key) {
		if (key.equals("enter") || shortCut!=null && key.equals(shortCut)) // enter or shortcut
		{
			w.core.audioServer.play(SOUND_INPUTSELECTED);
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
	public boolean handleMouse(final UiMouseEvent mouseEvent)
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
	public void read(final InputCapsule capsule) throws IOException {
		// TODO Auto-generated method stub
		
	}
	public void write(final OutputCapsule capsule) throws IOException {
		// TODO Auto-generated method stub
		
	}

}
