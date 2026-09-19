/*
 *  This file is part of JavaCRPG.
 *  Copyright (C) 2009
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

package org.jcrpg.ui.mouse;

import java.io.File;
import java.io.IOException;

import org.jcrpg.threed.J3DCore;

import com.ardor3d.image.Image;
import com.ardor3d.image.Texture.MinificationFilter;
import com.ardor3d.image.util.AWTImageLoader;
import com.ardor3d.image.util.ImageLoaderUtil;
import com.ardor3d.input.MouseCursor;
import com.ardor3d.scenegraph.Node;
import com.ardor3d.util.TextureManager;
import com.ardor3d.util.resource.ResourceLocatorTool;
import com.ardor3d.util.resource.ResourceSource;
import com.ardor3d.util.resource.SimpleResourceLocator;

/**
 * <code>MenuMouseHandler</code> defines an InputHandler that allows hit detection on menu objects
 * @author mkienenb
 */
public class UiMouseHandler {

    private UiMouseAction uiMouseAction;

    
    public static final String URL_CURSOR_NORMAL = "cursor1.png";
    public static final String URL_CURSOR_SET = "cursor1Set.png";
    public static final String URL_CURSOR_UP = "cursor1Up.png";
    public static final String URL_CURSOR_DOWN = "cursor1Down.png";
    public static final String URL_CURSOR_LEFT = "cursor1Left.png";
    public static final String URL_CURSOR_RIGHT = "cursor1Right.png";
    
    public static MouseCursor CURSOR_NORMAL;
    public static MouseCursor CURSOR_SET;
    public static MouseCursor CURSOR_UP;
    public static MouseCursor CURSOR_DOWN;
    public static MouseCursor CURSOR_LEFT;
    public static MouseCursor CURSOR_RIGHT;
    
    public static final String MOUSE_RES = "mouse";
    
    public MouseCursor loadCursor(String name, int left, int up)
    {
    	ResourceSource s = ResourceLocatorTool.locateResource(MOUSE_RES, name);
    	System.out.println("LOADING CURSOR "+name+" "+s);
    	Image i = TextureManager.load(s, MinificationFilter.NearestNeighborNoMipMaps,false).getImage();
    	//Image i = ImageLoaderUtil.loadImage(ResourceLocatorTool.locateResource("MOUSE", name), false);
    	MouseCursor c = new MouseCursor(name, i, left, up);
    	return c;
    }
    
    private MouseCursor createMouseCursor(final AWTImageLoader awtImageLoader, final String resourceName,int left,int up)
    throws IOException {
    	ResourceSource s = ResourceLocatorTool.locateResource(MOUSE_RES, resourceName);
		final Image image = awtImageLoader.load(s.openStream(), true);
		
		return new MouseCursor("cursor1", image, left, image.getHeight() - 1 - up);
    }


    public static void setCursor(MouseCursor c)
    {
    	//if (true) return;
    	J3DCore.getInstance().getMouseManager().setCursor(c);
    }

    public UiMouseHandler() {
    	final AWTImageLoader awtImageLoader = new AWTImageLoader();
    	try {
    	ResourceLocatorTool.addResourceLocator(MOUSE_RES, new SimpleResourceLocator(new File("../media/textures/cursor/").toURI().toURL()));

    	CURSOR_NORMAL = createMouseCursor(awtImageLoader,URL_CURSOR_NORMAL,0,0);
    	CURSOR_SET = createMouseCursor(awtImageLoader,URL_CURSOR_SET,5,25);
    	CURSOR_UP = createMouseCursor(awtImageLoader,URL_CURSOR_UP,5,5);
    	CURSOR_DOWN = createMouseCursor(awtImageLoader,URL_CURSOR_DOWN,5,5);
    	CURSOR_LEFT = createMouseCursor(awtImageLoader,URL_CURSOR_LEFT,5,5);
    	CURSOR_RIGHT = createMouseCursor(awtImageLoader,URL_CURSOR_RIGHT,5,5);
    	
    	} catch (Exception ex)
    	{
    		ex.printStackTrace();
    		System.exit(255);
    	}
    	
    	
    	//RelativeMouse mouse = new RelativeMouse("Mouse Input");
        //mouse.registerWithInputHandler( this );

        //uiMouseAction = new UiMouseAction(mouse);
        //addAction(uiMouseAction);
		//org.lwjgl.input.Mouse.setGrabbed(true);
		//MouseInput.get().setCursorVisible(true);
			setCursor(CURSOR_NORMAL);
    }
    
    static boolean normal = false;
    public static void normalCursor()
    {
		try {
			if (!normal)
				setCursor(CURSOR_NORMAL);

			if (!normal)
			{
				normal = true;
			//	throw new Exception();
			}
		} catch (Exception ex)
		{
			ex.printStackTrace();
		}
    }
    public static void forceNormalCursor()
    {
		try {
			setCursor(CURSOR_NORMAL);
			
			if (!normal)
			{
				normal = true;
			//	throw new Exception();
			}
		} catch (Exception ex)
		{
			ex.printStackTrace();
		}
    }
    public static void cursorUp()
    {
		try {
			normal = false;
			setCursor(CURSOR_UP);
		} catch (Exception ex)
		{
			ex.printStackTrace();
		}
    }
    public static void cursorDown()
    {
		try {
			normal = false;
			setCursor(CURSOR_DOWN);
		} catch (Exception ex)
		{
			ex.printStackTrace();
		}
    }
    public static void cursorRight()
    {
		try {
			normal = false;
			setCursor(CURSOR_RIGHT);
		} catch (Exception ex)
		{
			ex.printStackTrace();
		}
    }
    public static void cursorLeft()
    {
		try {
			normal = false;
			setCursor(CURSOR_LEFT);
		} catch (Exception ex)
		{
			ex.printStackTrace();
		}
    }
    public static void cursorSet()
    {
		try {
			normal = false;
			setCursor(CURSOR_SET);
		} catch (Exception ex)
		{
			ex.printStackTrace();
		}
    }
    
    public UiMouseAction getUiMouseAction() {
        return uiMouseAction;
    }

	public void setRootNode(com.ardor3d.scenegraph.Node rootNode) {
		uiMouseAction.setRootNode(rootNode);
	}
	public void setSecondaryFocusNode(Node node) {
		uiMouseAction.setSecondaryFocusNode(node);
	}
}
