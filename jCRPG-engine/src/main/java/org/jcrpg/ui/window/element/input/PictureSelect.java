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
import java.util.ArrayList;
import java.util.HashMap;

import org.jcrpg.apps.Jcrpg;
import org.jcrpg.threed.J3DCore;
import org.jcrpg.ui.Window;
import org.jcrpg.ui.mouse.UiMouseEvent;
import org.jcrpg.ui.mouse.UiMouseHandler;
import org.jcrpg.ui.mouse.UiMouseEvent.UiMouseEventType;
import org.jcrpg.ui.window.InputWindow;

import com.ardor3d.bounding.BoundingBox;
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
public class PictureSelect extends InputBase {

	public static final int UNDEFINED = -999999;
	public String text;
	
	public static final String defaultImage = "/buttonBase.png";
	public String bgImage = defaultImage; 
	public float textProportion = 400f;
	
	public String picturesPath = null; 
	public int selected = 0;
	
	public PictureSelect(String id, InputWindow w, Node parentNode, float centerX, float centerY, float sizeX,
			float sizeY, float textProportion) {
		super(id, w, parentNode, centerX, centerY, sizeX, sizeY);
		this.text = ""+value;
		this.textProportion = textProportion;
		deactivate();
		w.base.addEventHandler("lookLeft", w);
		w.base.addEventHandler("lookRight", w);
		w.base.addEventHandler("enter", w);
	}
	
	com.ardor3d.scenegraph.Node activeNode = null;
	Node deactiveNode = null;
	
	public int getSelection()
	{
		
		return selected;
	}
	
	public String getPictureId()
	{
		if (filesList!=null && filesList.size()>0)
			return filesList.get(selected).getName();
		return null;
	}
	
	ArrayList<File> filesList = new ArrayList<File>();
	HashMap<File, Quad> picQuads = new HashMap<File, Quad>();
	
	public void updateFiles()
	{
		picQuads.clear();
		filesList.clear();
		File f = new File(picturesPath);
		if (J3DCore.LOGGING()) Jcrpg.LOGGER.finest("PicSelect # FILE: "+f.getAbsolutePath());
		String[] files = f.list();
		if (files!=null)
		for (String file:files)
		{
			if (J3DCore.LOGGING()) Jcrpg.LOGGER.finest("# FILE: "+file);
			if (file.endsWith(".png"))
			if (!new File(f.getAbsolutePath()+"/"+file).isDirectory())
			{
				filesList.add(new File(f.getAbsolutePath()+"/"+file));
				System.out.println(filesList.get(filesList.size()-1));
			}
		}
		
	}

	@Override
	public void activate() {
		if (updated)
		{
			updated = false;
			updateFiles();
			selected = 0;
		}
		baseNode.detachAllChildren();
		{
			if (activeNode==null) {
				activeNode = new Node(""+id);
				try {
					Quad w1 = Window.loadImageToQuad(new File(bgImage), dSizeX, dSizeY, dCenterX, dCenterY);
					w1.setSolidColor(ColorRGBA.WHITE);
					activeNode.attachChildAt(w1,0);
				} catch (Exception ex)
				{
					ex.printStackTrace();
				}
			}
			if (filesList.size()!=0) {
				File f = filesList.get(selected);
				Quad q = picQuads.get(f);
				if (q==null)
				{
					try {
						q = Window.loadImageToQuadDirectly(f, dSizeX*0.96f, dSizeY*0.96f, dCenterX, dCenterY);
					} catch (Exception ex)
					{
						ex.printStackTrace();
					}
				}
				q.setSolidColor(ColorRGBA.WHITE);
				activeNode.attachChildAt(q,0);
			}
		}
		baseNode.attachChildAt(activeNode,0);
		super.activate();
	}

	@Override
	public void deactivate() {
		if (updated)
		{
			updated = false;
			updateFiles();
			selected = 0;
		}
		baseNode.detachAllChildren();
		{
			if (deactiveNode==null) {
				deactiveNode = new Node(""+id);
				try {
					Quad w1 = Window.loadImageToQuad(new File(bgImage), dSizeX, dSizeY, dCenterX, dCenterY);
					w1.setSolidColor(ColorRGBA.GRAY);
					deactiveNode.attachChildAt(w1,0);
				} catch (Exception ex)
				{
					ex.printStackTrace();
				}
			}
			if (filesList.size()!=0) {
				File f = filesList.get(selected);
				Quad q = picQuads.get(f);
				if (q==null)
				{
					try {
						q = Window.loadImageToQuadDirectly(f, dSizeX*0.96f, dSizeY*0.96f, dCenterX, dCenterY);
					} catch (Exception ex)
					{
						ex.printStackTrace();
					}
				}
				q.setSolidColor(ColorRGBA.GRAY);
				deactiveNode.attachChildAt(q,0);
			}
			
		}
		baseNode.attachChildAt(deactiveNode,0);
		super.deactivate();
	}

	@Override
	public boolean handleKey(String key) {
		if (key.equals("lookRight"))
		{
			if (selected == filesList.size()-1) return true;
			selected++;
			activate();
		} else
		if (key.equals("lookLeft"))
		{
			if (selected == 0) return true;
			selected--;
			activate();
		} 
		return false;
	}

	@Override
	public void reset() {
		// TODO Auto-generated method stub
		
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
						
						if (mouseEvent.getAreaSpatial().ratioY>0.5f)
					{
							return handleKey("lookRight");
						} else
						{
							return handleKey("lookLeft");
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
						if (mouseEvent.getAreaSpatial().ratioY>0.5f)
						{
							UiMouseHandler.cursorDown();
							return true;
						} else
						{
							UiMouseHandler.cursorUp();
							return true;
						}
				}
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
