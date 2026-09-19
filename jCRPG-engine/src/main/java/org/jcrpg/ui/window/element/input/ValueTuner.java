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

import org.jcrpg.threed.J3DCore;
import org.jcrpg.ui.Window;
import org.jcrpg.ui.mouse.UiMouseEvent;
import org.jcrpg.ui.mouse.UiMouseHandler;
import org.jcrpg.ui.mouse.UiMouseEvent.UiMouseEventType;
import org.jcrpg.ui.window.InputWindow;

import com.ardor3d.math.ColorRGBA;
import com.ardor3d.scenegraph.Node;
import com.ardor3d.scenegraph.shape.Quad;
import com.ardor3d.util.export.InputCapsule;
import com.ardor3d.util.export.OutputCapsule;

/**
 * Numeric value selection.
 * @author pali
 *
 */
public class ValueTuner extends InputBase {

	public static final int UNDEFINED = -999999;
	public String text;
	
	public static final String defaultImage = "/tunerBase.png";
	public String bgImage = defaultImage; 
	public float textProportion = 400f;
	
	public int oldValue, value, minValue, maxValue, step = 1;
	public Object tunedObject;
	
	public boolean minValueVisible = false;

	public ValueTuner(String id, InputWindow w, Node parentNode, float textProportion, 
						int value, int minValue, int maxValue, int step) {
		super(id, w, parentNode);
		this.text = ""+value;
		this.value = value;
		this.minValue = minValue;
		this.maxValue = maxValue;
		this.step = step;
		this.textProportion = textProportion;
	}

	public ValueTuner(String id, InputWindow w, Node parentNode, float centerX, float centerY, float sizeX,
			float sizeY, float textProportion, int value, int minValue, int maxValue, int step) {
		super(id, w, parentNode, centerX, centerY, sizeX, sizeY);
		this.text = ""+value;
		this.value = value;
		this.minValue = minValue;
		this.maxValue = maxValue;
		this.step = step;
		this.textProportion = textProportion;
		deactivate();
		w.base.addEventHandler("lookLeft", w);
		w.base.addEventHandler("lookRight", w);
		w.base.addEventHandler("enter", w);
	}

	@Override
	public void init(float centerX, float centerY, float sizeX, float sizeY) {
		super.init(centerX, centerY, sizeX, sizeY);
		if (baseNode!=null) {
			deactivate(); 
			w.base.addEventHandler("lookLeft", w);
			w.base.addEventHandler("lookRight", w);
			w.base.addEventHandler("enter", w);
		}
	}

	Node activeNode = null;
	Node deactiveNode = null;
	
	public int getSelection()
	{
		return value;
	}

	@Override
	public void activate() {
		if (updated)
		{
			updated = false;
			text = ""+value+(minValueVisible?" ("+minValue+")":"");
		}
		baseNode.detachAllChildren();
		{
			activeNode = new Node(""+id);
			try {
				Quad w1 = Window.loadImageToQuad(new File(bgImage), dSizeX, dSizeY, dCenterX, dCenterY);
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
				} else
				{
					textText.setText(text);
				}
				textText.setTranslation(textText.getCenterOrigoX(dCenterX,scale), - textText.getHeight2()/2f*scale + dCenterY,0);
				activeNode.attachChildAt(textText,0);
				textText.setTextColor(new ColorRGBA(0.8f,0.8f,0.1f,1f));
			}
		}
		baseNode.attachChildAt(activeNode,0);
		super.activate();
	}

	org.jcrpg.ui.BasicText textText = null;
	
	@Override
	public void deactivate() {
		if (updated)
		{
			updated = false;
			text = ""+value+(minValueVisible?" ("+minValue+")":"");
		}
		baseNode.detachAllChildren();
		{
			deactiveNode = new Node(""+id);
			try {
				Quad w1 = Window.loadImageToQuad(new File(bgImage), dSizeX, dSizeY, dCenterX, dCenterY);
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
				} else
				{
					textText.setText(text);
				}
				textText.setTranslation(textText.getCenterOrigoX(dCenterX,scale), - textText.getHeight2()/2f*scale +dCenterY,0);
				deactiveNode.attachChildAt(textText,0);
				textText.setTextColor(new ColorRGBA(0.6f,0.6f,0.1f,1f));
			}
		}
		baseNode.attachChildAt(deactiveNode,0);
		super.deactivate();
	}

	@Override
	public boolean handleKey(String key) {
		if (key.equals("lookLeft"))
		{
			if (value-step<minValue) return true;
			int orig = value;
			value-=step;
			if (!w.inputUsed(this, key)) value=orig;
			text = ""+value+(minValueVisible?" ("+minValue+")":"");
			setValue(text);
			activate();
			return true;
		} else
		if (key.equals("lookRight"))
		{
			if (value+step>maxValue) return true;
			int orig = value;
			value+=step;
			if (!w.inputUsed(this, key)) value=orig;
			text = ""+value+(minValueVisible?" ("+minValue+")":"");
			setValue(text);
			activate();
			return true;
		} else
		if (key.equals("enter"))
		{
			w.core.audioServer.play(SOUND_INPUTSELECTED);
			w.inputUsed(this, key);
			return true;
		}
		return false;
	}

	public int getStep() {
		return step;
	}

	public void setStep(int step) {
		this.step = step;
	}

	@Override
	public void reset() {
		value = oldValue;
		text = ""+value;
		
	}
	
	public void setValue(int value) {
	    this.value = value;
	}

	
	@Override
	public boolean handleMouse(UiMouseEvent mouseEvent) {
		if (isEnabled())
		{

			super.handleMouse(mouseEvent);

			if (focusUponMouseEnter)
			{
				if (mouseEvent.getEventType()==UiMouseEventType.MOUSE_ENTERED)
				{
					if (isEnabled() && !active)
					{
						activate();
						return false;
					}
				} else
				if (mouseEvent.getEventType()==UiMouseEventType.MOUSE_EXITED)
				{
					if (isEnabled() && active)
					{
						deactivate();
						return false;
					}
				}
				
			}
			if (mouseEvent.getEventType()==UiMouseEventType.MOUSE_PRESSED)
			{
				if (mouseEvent.isButtonPressed(UiMouseEvent.BUTTON_LEFT))
				{
					if (active)
					{
						
						if (mouseEvent.getAreaSpatial().ratioX<0.33f)
						{
							handleKey("lookLeft");
							return true;
						} else
						if (mouseEvent.getAreaSpatial().ratioX>0.66f)
						{
							handleKey("lookRight");
							return true;
						} else
						{
							boolean b = handleKey("enter");
							if (deactivateUponUse)
							{
								w.inputLeft(this, "");
								deactivate();
							}
							return b;
						}
					} else
					{
						activate();
						return true;
					}
				}
			}

			if (mouseEvent.getEventType()==UiMouseEventType.MOUSE_MOVED)
			{
				if (isEnabled() && active)
				{
					{
						if (mouseEvent.getAreaSpatial().ratioX<0.40f)
						{
							UiMouseHandler.cursorLeft();
							return true;
						} else
						if (mouseEvent.getAreaSpatial().ratioX>0.60f)
						{
							UiMouseHandler.cursorRight();
							return true;
						} else
						{
							UiMouseHandler.cursorSet();
							return true;
						}
					}
						//MouseInput.get().setHardwareCursor(arg0)
				}
			} 

			if (mouseEvent.getEventType()==UiMouseEventType.MOUSE_RELEASED)
			{
				return true;
			}
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
