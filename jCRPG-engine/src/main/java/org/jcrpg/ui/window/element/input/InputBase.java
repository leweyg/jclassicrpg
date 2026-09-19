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

import org.jcrpg.threed.J3DCore;
import org.jcrpg.ui.mouse.UiMouseEvent;
import org.jcrpg.ui.mouse.UiMouseEvent.UiMouseEventType;
import org.jcrpg.ui.window.InputWindow;

import com.ardor3d.bounding.BoundingBox;
import com.ardor3d.math.ColorRGBA;
import com.ardor3d.math.type.ReadOnlyColorRGBA;
import com.ardor3d.scenegraph.Node;
import com.ardor3d.scenegraph.Spatial;
import com.ardor3d.scenegraph.hint.CullHint;
import com.ardor3d.scenegraph.hint.TextureCombineMode;
import com.ardor3d.scenegraph.shape.Quad;
import com.ardor3d.ui.text.BasicText;
import com.ardor3d.util.export.Ardor3dExporter;
import com.ardor3d.util.export.Ardor3dImporter;
import com.ardor3d.util.export.Savable;


public abstract class InputBase implements Savable{
	
	public static final String UI_ELEMENT = "InputBaseNode";
	
	public static final int DEF_FONT_SIZE = 10;
	
	public double centerX, centerY;
	public double sizeX, sizeY;
	public double dCenterX, dCenterY;
	public double dSizeX, dSizeY;
	public double dOrigoX, dOrigoY;
	public double dOrigoXCenter, dOrigoYCenter;
	public InputWindow w;
	public Node baseNode;
	boolean active = false;
	boolean enabled = true;
	boolean updated = false;
	
	public boolean focusUponMouseEnter = false;
	public boolean deactivateUponUse = true;
	
	
	public Node parentNode = null;
	
	public String id = null;
	
	public static final String SOUND_INPUTSELECTED = "input_selected";
	
	public static final ColorRGBA DEF_NORMAL_COLOR = new ColorRGBA(0.9f,0.9f,0.1f,1f);
	public static final ColorRGBA DEF_OUTLINE_COLOR = new ColorRGBA(0.05f,0.05f,0.05f,1f);
	public static final ColorRGBA DEF_DEACTIVATED_COLOR = new ColorRGBA(0.5f,0.5f,0.1f,1f);
	public static final ReadOnlyColorRGBA DEF_DISABLED_COLOR = ColorRGBA.GRAY;
	
	protected ColorRGBA normalColor = DEF_NORMAL_COLOR;
	protected ColorRGBA outlineColor = DEF_OUTLINE_COLOR;
	protected ColorRGBA deactivatedColor = DEF_DEACTIVATED_COLOR;
	protected ReadOnlyColorRGBA disabledColor = DEF_DISABLED_COLOR;
	
	public class UI_ELEMENT_SPEC 
	{
		public InputBase input;
		public UI_ELEMENT_SPEC(InputBase i)
		{
			input = i;
		}
	}
	
	public InputBase(String id, InputWindow w, Node parentNode)
	{
		this.id = id;
		this.parentNode = parentNode;
		this.w = w;
		baseNode = new Node(UI_ELEMENT);
		baseNode.setUserData(new UI_ELEMENT_SPEC(this));
		parentNode.attachChildAt(baseNode,0);
		//parentNode.updateRenderState();
	}
	
	public InputBase(String id, InputWindow w, Node parentNode, float centerX, float centerY, float sizeX, float sizeY)
	{
		this.id = id;
		this.parentNode = parentNode;
		this.w = w;
		init(centerX, centerY, sizeX, sizeY);
		baseNode = new Node(UI_ELEMENT);
		baseNode.setUserData(new UI_ELEMENT_SPEC(this));
		parentNode.attachChildAt(baseNode,0);
		//parentNode.updateRenderState();
	}
	
	/** Useful for setting the element's dimensions from a Layout */
	public void init(float centerX, float centerY, float sizeX, float sizeY) {
		this.centerX = centerX;
		this.centerY = centerY;
		this.sizeX = sizeX;
		this.sizeY = sizeY;
		dCenterX = J3DCore.getInstance().getDisplay().getWidth()*(centerX);
		dCenterY = J3DCore.getInstance().getDisplay().getHeight()*(1f-centerY);
		dSizeX =  J3DCore.getInstance().getDisplay().getWidth()*(sizeX);
		dSizeY =  J3DCore.getInstance().getDisplay().getHeight()*(sizeY);
		dOrigoX = dCenterX-dSizeX/2;
		dOrigoXCenter = dCenterX+dSizeX/2;
		dOrigoY = dCenterY+dSizeY/2;
	}
	
	/**
	 * make this input visible again, and enabled = true.
	 */
	public void reattach()
	{
		parentNode.attachChildAt(baseNode,0);
		enabled = true;
	}
	/**
	 * remove this input from visible elements and enabled = false.
	 */
	public void detach()
	{
		baseNode.removeFromParent();
		enabled = false;
	}

	public String value = "";
	
	public void setValue(String value)
	{
		this.value = value;
	}
	
	public String getValue()
	{
		return value;
	}
	
	/**
	 * This is run when an input field is selected in an input window.
	 */
	public void activate()
	{
		if (w!=null) w.inputActivated(this);
		active = true;
	}
	/**
	 * This is run when an input field is deselected in an input window.
	 */
	public void deactivate()
	{
		active = false;
	}
	
	/**
	 * 
	 * @param key
	 */
	public boolean handleKey(String key)
	{
		return true;
	}

	public boolean handleMouse(UiMouseEvent mouseEvent)
	{
		if (!focusUponMouseEnter)
		{
				if (mouseEvent.getEventType()==UiMouseEventType.MOUSE_ENTERED)
				{
					handleMouseHover(true);
				} else
				if (mouseEvent.getEventType()==UiMouseEventType.MOUSE_EXITED)
				{
					handleMouseHover(false);
				}
		}		
		return false;
	}

	public boolean isUpdated() {
		return updated;
	}

	public void setUpdated(boolean updated) {
		this.updated = updated;
	}

	public boolean isEnabled() {
		return enabled;
	}

	public boolean isActive()
	{
		return active;
	}
	
	public void setEnabled(boolean enabled) {
		this.enabled = enabled;
	}
	
	public abstract void reset();
	
	boolean stored = false;
	public boolean isStored()
	{
		return stored;
	}
	public void store()
	{
		stored = true;
	}
	public void restore()
	{
	}
	
	public void colorizeOutlined(Node textNode, ColorRGBA color)
	{
		try {
			int cc=0;
			for (Spatial q: textNode.getChildren())
			{
				if (!J3DCore.NATIVE_FONT_RENDER)
				{
					if (cc%2==1) ((Quad)q).setDefaultColor(color);
				} else
				{
					((BasicText)q).setTextColor(color);
				} 
				cc++;
			}
		} catch (Exception ex) {}
		
	}
	public void colorize(Node textNode, ReadOnlyColorRGBA color)
	{
		try {
			int cc=0;
			for (Spatial q: textNode.getChildren())
			{
				if (!J3DCore.NATIVE_FONT_RENDER)
				{
					((Quad)q).setDefaultColor(color);
				} else
				{
					((com.ardor3d.ui.text.BasicText)q).setTextColor(color);
				}
				cc++;
			}
		} catch (Exception ex) {}
		
	}

/*	public HashMap<Node,FontTT> currentTextNodes = new HashMap<Node,FontTT>();
	
	public void freeTextNodes()
	{
		for (Node n:currentTextNodes.keySet())
		{
			FontTT font = currentTextNodes.get(n);
			font.moveFreedToCache(n);
		}
		currentTextNodes.clear();
	}
	*/
	
	
	public Class getClassTag() {
		// TODO Auto-generated method stub
		return null;
	}
	public void read(Ardor3dImporter arg0) throws IOException {
		// TODO Auto-generated method stub
		
	}
	public void write(Ardor3dExporter arg0) throws IOException {
		// TODO Auto-generated method stub
		
	}

	public final static float TEXT_PROP = 2.2f;
	
	protected org.jcrpg.ui.BasicText createText(String text)
	{
		org.jcrpg.ui.BasicText t = org.jcrpg.ui.BasicText.createDefaultTextLabel("TextBox_", text);
		t.getSceneHints().setCullHint(CullHint.Never );
		t.getSceneHints().setTextureCombineMode( TextureCombineMode.Replace );
		t.setModelBound(new BoundingBox());
		t.updateModelBound();
		return t;
	}
	
	public void handleMouseHover(boolean entering)
	{
		System.out.println("handleMouseHover "+entering);
		if (!isActive() && isEnabled())
		{
			Node n = getDeactivatedNode();
			if (n!=null)
			if (entering)
			{
				for (Spatial n2:n.getChildren())
				{
					if (n2 instanceof Quad)
					{
						((Quad)n2).setSolidColor(ColorRGBA.WHITE);
					}
				
				}
			}
			else
			{
				for (Spatial n2:n.getChildren())
				{
					if (n2 instanceof Quad)
					{
						((Quad)n2).setSolidColor(ColorRGBA.GRAY);
					}
				
				}
			}
		}
	

	}
	
	public abstract Node getDeactivatedNode();
	
	/**
	 * Setting this is fallback when no tooltip for selected item in the extender UI class.
	 */
	public String globalTooltip = null;

	public String getTooltipText()
	{
		return globalTooltip;
	}
		
	public boolean needsDeactivationInLayout()
	{
		return false;
	}
	
}
