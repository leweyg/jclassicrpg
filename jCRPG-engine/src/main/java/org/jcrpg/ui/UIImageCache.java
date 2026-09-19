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
import java.util.HashMap;

import org.jcrpg.apps.Jcrpg;
import org.jcrpg.threed.J3DCore;
import org.jcrpg.threed.engine.ui.ZoomingQuad;

import com.ardor3d.image.Texture;
import com.ardor3d.image.Texture.MinificationFilter;
import com.ardor3d.math.Vector3;
import com.ardor3d.renderer.state.TextureState;
import com.ardor3d.scenegraph.shape.Quad;
import com.ardor3d.util.TextureManager;
import com.ardor3d.util.resource.ResourceLocatorTool;
import com.ardor3d.util.resource.URLResourceSource;

public class UIImageCache {

	public static HashMap<String, TextureState> imageCache = new HashMap<String, TextureState>();
	
	public static Quad getImage(String filePath, boolean alpha, float sizeMul)
	{
		if (J3DCore.SETTINGS.DISABLE_DDS && filePath.toLowerCase().endsWith("dds"))
		{
			filePath = filePath.substring(0,filePath.length()-3)+"png";
		}
		TextureState q = imageCache.get(filePath);
		if (q==null)
		{
			try {
				Texture texture = TextureManager.load(ResourceLocatorTool.locateResource(UIBase.RES_TYPE_UI, filePath), MinificationFilter.BilinearNearestMipMap,  true);
				
				TextureState state = new TextureState();
				state.setTexture(texture,0);
				
				q = state;
				imageCache.put(filePath, q);
			} catch (Exception ex)
			{
				ex.printStackTrace();
				q = null;//new Quad();
			}
			
		}
		Quad quad = new Quad(filePath, 1f * sizeMul, 1f * sizeMul);
		if (alpha) quad.setRenderState(J3DCore.getInstance().uiBase.hud.hudAS);
		quad.setRenderState(q);
		//quad.setRenderQueueMode(Renderer.QUEUE_ORTHO);
		quad.setModelBound(new com.ardor3d.bounding.BoundingBox());
		quad.updateModelBound();
		quad.setTranslation(new Vector3(0, 0, 0));
		if (J3DCore.LOGGING()) Jcrpg.LOGGER.finest("UIImageCache LOADED "+filePath);
		return quad;
	}
	public static Quad getImage(String filePath, boolean alpha, double sizeX, double sizeY)
	{
		return getImage(UIBase.RES_TYPE_UI,filePath, alpha, sizeX, sizeY);
	}
	public static Quad getImage(String resType, String filePath, boolean alpha, double sizeX, double sizeY)
	{
		if (J3DCore.SETTINGS.DISABLE_DDS && filePath.toLowerCase().endsWith("dds"))
		{
			filePath = filePath.substring(0,filePath.length()-3)+"png";
		}
		TextureState q = imageCache.get(filePath);
		if (q==null)
		{
			try {
				Texture texture = TextureManager.load(ResourceLocatorTool.locateResource(resType, filePath), MinificationFilter.BilinearNearestMipMap,  true);
				TextureState state = new TextureState();
				state.setTexture(texture,0);
				q = state;
				imageCache.put(filePath, q);
			} catch (Exception ex)
			{
				ex.printStackTrace();
				q = null;//new Quad();
			}
			
		}
		Quad quad = new Quad(filePath, 1f * sizeX, 1f * sizeY);
		if (alpha) quad.setRenderState(J3DCore.getInstance().uiBase.hud.hudAS);
		quad.setRenderState(q);
		quad.setModelBound(new com.ardor3d.bounding.BoundingBox());
		quad.updateModelBound();
		//quad.setRenderQueueMode(Renderer.QUEUE_ORTHO);

		quad.setTranslation(new Vector3(0, 0, 0));
		//System.out.println("LOADED: "+filePath);
		if (filePath.startsWith("."))
		{//new Throwable().printStackTrace();
		//System.exit(-1);
		}//if (J3DCore.LOGGING()) Jcrpg.LOGGER.finest("LOADED "+filePath);
		return quad;
	}
	public static Quad getImageDirectlyFromFile( String filePath, boolean alpha, double sizeX, double sizeY)
	{
		if (J3DCore.SETTINGS.DISABLE_DDS && filePath.toLowerCase().endsWith("dds"))
		{
			filePath = filePath.substring(0,filePath.length()-3)+"png";
		}
		TextureState q = imageCache.get(filePath);
		if (q==null)
		{
			try {
				Texture texture = TextureManager.load(new URLResourceSource(new File(filePath).toURI().toURL()), MinificationFilter.BilinearNearestMipMap,  true);
				TextureState state = new TextureState();
				state.setTexture(texture,0);
				q = state;
				imageCache.put(filePath, q);
			} catch (Exception ex)
			{
				ex.printStackTrace();
				q = null;//new Quad();
			}
			
		}
		Quad quad = new Quad(filePath, 1f * sizeX, 1f * sizeY);
		if (alpha) quad.setRenderState(J3DCore.getInstance().uiBase.hud.hudAS);
		quad.setRenderState(q);
		//quad.setRenderQueueMode(Renderer.QUEUE_ORTHO);
		quad.setModelBound(new com.ardor3d.bounding.BoundingBox());
		quad.updateModelBound();

		quad.setTranslation(new Vector3(0, 0, 0));
		//System.out.println("LOADED: "+filePath);
		if (filePath.startsWith("."))
		{//new Throwable().printStackTrace();
		//System.exit(-1);
		}//if (J3DCore.LOGGING()) Jcrpg.LOGGER.finest("LOADED "+filePath);
		return quad;
	}

	public static ZoomingQuad getImageZoomingQuad(String filePath, boolean alpha, double sizeX, double sizeY)
	{
		if (J3DCore.SETTINGS.DISABLE_DDS && filePath.toLowerCase().endsWith("dds"))
		{
			filePath = filePath.substring(0,filePath.length()-3)+"png";
		}
		TextureState q = imageCache.get(filePath);
		if (q==null)
		{
			try {
				Texture texture = TextureManager.load(new URLResourceSource(new File(filePath).toURI().toURL()), MinificationFilter.BilinearNearestMipMap,  true);
				TextureState state = new TextureState();
	
				state.setTexture(texture,0);
	
				q = state;
				imageCache.put(filePath, q);
			} catch (Exception ex)
			{
				ex.printStackTrace();
				q = null;//new Quad();
			}
			
		}
		ZoomingQuad quad = new ZoomingQuad(filePath, 1f * sizeX, 1f * sizeY);
		if (alpha) quad.setRenderState(J3DCore.getInstance().uiBase.hud.hudAS);
		quad.setRenderState(q);
		//quad.setRenderQueueMode(Renderer.QUEUE_ORTHO);
		quad.setModelBound(new com.ardor3d.bounding.BoundingBox());
		quad.updateModelBound();

		quad.setTranslation(new Vector3(0, 0, 0));
		//if (J3DCore.LOGGING()) Jcrpg.LOGGER.finest("LOADED "+filePath);
		return quad;
	}

}
