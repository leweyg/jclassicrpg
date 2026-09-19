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

package org.jcrpg.ui.map;

import java.awt.Color;
import java.awt.Graphics;
import java.awt.image.BufferedImage;
import java.nio.ByteBuffer;
import java.util.HashMap;
import java.util.HashSet;

import org.jcrpg.apps.Jcrpg;
import org.jcrpg.space.Side;
import org.jcrpg.threed.J3DCore;
import org.jcrpg.threed.scene.RenderedArea;
import org.jcrpg.threed.scene.RenderedCube;
import org.jcrpg.world.place.World;
import org.jcrpg.world.place.economic.residence.dungeon.SimpleDungeonPart;

import com.ardor3d.image.Image;
import com.ardor3d.image.ImageDataFormat;
import com.ardor3d.image.ImageDataType;
import com.ardor3d.image.Texture;
import com.ardor3d.image.Texture2D;
import com.ardor3d.image.Texture.MinificationFilter;
import com.ardor3d.image.util.AWTImageLoader;
import com.ardor3d.math.Vector3;
import com.ardor3d.renderer.Renderer;
import com.ardor3d.renderer.state.RenderState;
import com.ardor3d.renderer.state.TextureState;
import com.ardor3d.scenegraph.extension.BillboardNode;
import com.ardor3d.scenegraph.shape.Quad;
import com.ardor3d.scenegraph.shape.Sphere;
import com.ardor3d.util.TextureKey;
import com.ardor3d.util.geom.BufferUtils;

public class LocalMap {
	public Quad mapQuad = new Quad("WORLD_MAP",2f,2f);
	public BillboardNode bbMap;
	public Sphere mapSphere = new Sphere("WORLD_MAP_SPHERE",new Vector3(0,0,0),10,10,0.5f);
	public Image oceanImage;
	//public Image staticLayer; 
	public Graphics staticLayerGraphics;
    private BufferedImage staticLayer;

	//public Object staticLayerGraphics;
	public Image climateImage;
	public Image geoImage;
	public byte[] positionImageSet;
	
	public int[][] map;
	
	public Texture oceanTex, staticLayerTex,staticLayerTex2, climateTex, geoTex;
	public TextureState baseTexState, staticTexState, climateTexState, geoTexState;

	public RenderedArea area;
	public World world;
	
	public int NOTHING = 0;
	public int WATER = 1;
	// 2
	// 4
	// 8
	// 16
	// 32
	// 64
	// 128
	
	public static int localMapSizeX = 13; 
	public static int localMapSizeY = 13;
	public static int centerX = 7;
	public static int centerY = 7;
	public int centerXPlus = 8;
	public int centerYPlus = 7;
	public int pointSizeX =5, pointSizeY = 5;
	public int pointSize = pointSizeX*pointSizeY;
	
	public byte[] staticLayerSet = new byte[localMapSizeX*localMapSizeY*4*pointSize];
	public byte[] dynamicLayerSet1 = new byte[localMapSizeX*localMapSizeY*4*pointSize];
	public byte[] dynamicLayerSet2 = new byte[localMapSizeX*localMapSizeY*4*pointSize];
	
	public int RED = 0, GREEN = 1, BLUE = 2, ALPHA = 3;
	
	
	public HashSet<Quad> updatedQuads = new HashSet<Quad>();
	
	public void registerQuad(Quad q)
	{
		updatedQuads.add(q);
	}
	
	static int byteToInt(byte b)
	{
		if ((int)b<0)
		{
			return 256+b;
		}
		return b;
	}
	

	public void paintPointAllSides(Graphics set, int x, int y, int r, int g, int b, int a)
	{
		for (int i=0; i<6; i++)
		{
			paintPoint(set, x, y, i, r, g, b, a);
		}
	}
	
	public static HashMap<Integer, Color> colorCache = new HashMap<Integer, Color>();
	public void paintPoint(Graphics set, int x, int y, int side, int r, int g, int b, int a)
	{
		for (byte[] p : sideOffsets[side])
		{
			a = 255;
			int k = (r<<24)+(g<<16)+(b<<8)+a;
			Color c = colorCache.get(k);
			if (c==null)
			{
				c = new Color(Math.max(0, Math.min(r,255)),Math.max(0, Math.min(g,255)),Math.max(0, Math.min(b,255)),a);
				colorCache.put(k, c);
			} 
			set.setColor(c);
			set.fillRect(x*pointSizeX+p[1]-1, y*pointSizeY+p[0]-1, p[3]+1, p[2]+1);
		}
	}
	
	
	public byte[][][] sideOffsets = new byte[][][]{
			//North 0
			{{2,-1,0,2}},
			//East 1
			{{-2,2,4,0}},
			//South 2
			{{-2,-1,0,2}},
			//West 3
			{{-2,-2,4,0}},
			//Top 4
			{},
			//Bottom 5
			{
				{-1,-1,2,2},
				//{0,-1,0,2},
				//{1,-1,0,2}
			},
	};
	
    private ByteBuffer imageBuffer;

    boolean updated = true;
	public void render(final Renderer renderer) {
		if (!updated) return;
		updated = false;
		
        final byte data[] = AWTImageLoader.asByteArray(staticLayer);
        if (imageBuffer==null)
        {
            imageBuffer = BufferUtils.createByteBuffer(data.length);
        }
        imageBuffer.put(data);
        imageBuffer.flip();
        final Texture prevTexture = ((TextureState) staticTexState)//.getLocalRenderState(RenderState.StateType.Texture))
                .getTexture();
        renderer.updateTexture2DSubImage((Texture2D) prevTexture, 0, 0, staticLayer.getWidth(), staticLayer.getHeight(),
                imageBuffer, 0, 0, staticLayer.getWidth());

	}
	
	public void update() {
		//if (true) return;
		try {
			
			updated = true;
			
			staticLayerGraphics.setColor(new Color(0,0,0,0));
			int dir = J3DCore.getInstance().gameState.getNormalPositions().viewDirection;
			if (dir == J3DCore.NORTH) {
				centerYPlus = centerY + 1;
				centerXPlus = centerX;
			} else if (dir == J3DCore.SOUTH) {
				centerYPlus = centerY - 1;
				centerXPlus = centerX;
			} else if (dir == J3DCore.EAST) {
				centerYPlus = centerY;
				centerXPlus = centerX + 1;
			} else if (dir == J3DCore.WEST) {
				centerYPlus = centerY;
				centerXPlus = centerX - 1;
			}
			int wX = J3DCore.getInstance().gameState.getNormalPositions().viewPositionX-centerX;
			int wY = J3DCore.getInstance().gameState.getNormalPositions().viewPositionY;
			int wZ = J3DCore.getInstance().gameState.getNormalPositions().viewPositionZ-centerY;
			for (int z = 0; z<localMapSizeY;z++)
			{
				for (int x=0; x<localMapSizeX; x++)
				{
					//int offset = ((z*localMapSizeX)+x)*4;
					if (x==centerX && z==centerY)
					{
						paintPointAllSides(staticLayerGraphics, x, z, 235, 20, 20, 110);
						continue;
					}
					if (x==centerXPlus && z==centerYPlus)
					{
						paintPointAllSides(staticLayerGraphics, x, z, 255, 100, 100, 110);
						continue;
					}
					RenderedCube c = area.getCubeAtPosition(world,wX+x,wY,wZ+z);
					RenderedCube cBelow = area.getCubeAtPosition(world,wX+x,wY-1,wZ+z);
					boolean water = cBelow!=null && cBelow.cube!=null && cBelow.cube.waterCube;
					if (c==null)
					{
						if (water) {
							paintPointAllSides(staticLayerGraphics, x, z, 0, 0, 200, 90);
						} else
						{
							paintPointAllSides(staticLayerGraphics, x, z, 0, 0, 0, 70);
						}
					} else
					{
						if (c.cube!=null && c.cube.bottom!=null) {
							boolean colorized = false;
							int[] neutralColor = new int[] {255, 255, 255, 70};
							int[] neutralColorSum = new int[] {0,0,0};
							int colorsAdded = 0;
							for (Side side:c.cube.bottom)
							{
								byte[] b = side.subtype.colorBytes;
								if (!colorized || side.subtype.colorOverwrite) {
									neutralColor[RED] = b[RED];
									neutralColor[GREEN] = b[GREEN];
									neutralColor[BLUE] = b[BLUE];
									if (side.subtype.colorOverwrite) {
										neutralColorSum[RED]+= (byteToInt(b[RED]));
										neutralColorSum[GREEN]+= (byteToInt(b[GREEN]));
										neutralColorSum[BLUE]+= (byteToInt(b[BLUE]));
										colorsAdded++;
										/*if (colorsAdded==2)
										{
											if (J3DCore.LOGGING()) Jcrpg.LOGGER.finest(side.subtype.id);
											if (J3DCore.LOGGING()) Jcrpg.LOGGER.finest("C: "+c.cube);
											if (J3DCore.LOGGING()) Jcrpg.LOGGER.finest("C: "+neutralColorSum[GREEN]);
											if (J3DCore.LOGGING()) Jcrpg.LOGGER.finest("C: "+(neutralColorSum[GREEN]/colorsAdded));
										}*/
									}
								}
								colorized = true;
							}
							if (colorsAdded==0) colorsAdded=1;
							neutralColor[RED] = (neutralColorSum[RED]/colorsAdded);
							neutralColor[GREEN] = (neutralColorSum[GREEN]/colorsAdded);
							neutralColor[BLUE] = (neutralColorSum[BLUE]/colorsAdded);
							paintPoint(staticLayerGraphics, x, z, 5, (neutralColorSum[RED]/colorsAdded), (neutralColorSum[GREEN]/colorsAdded), (neutralColorSum[BLUE]/colorsAdded), 80);
							for (int i=0; i<4; i++) {
								colorized = false;
								boolean dPart = false;
								if (c.cube.sides!=null && c.cube.sides[i]!=null)
								for (Side side:c.cube.sides[i])
								{
									byte[] b = side.subtype.colorBytes;
									if (side.subtype == SimpleDungeonPart.SUBTYPE_WALL)
									{
										//System.out.println("COLORIZED = "+colorized+ " "+byteToInt(b[RED]) +" "+ byteToInt(b[GREEN])+" "+ byteToInt(b[BLUE]));
										dPart = true;
									} else
										if (dPart)
										{
										//	System.out.println("OVERWRITE DPART = "+colorized);
										}
									if (!colorized || colorized && side.subtype.colorOverwrite) {
										paintPoint(staticLayerGraphics, x, z, i, byteToInt(b[RED]), byteToInt(b[GREEN]), byteToInt(b[BLUE]), 80);
									}
									colorized = true;
								}
								if (!colorized) { // color this with neutral (ground) color
									paintPoint(staticLayerGraphics, x, z, i, neutralColor[RED], neutralColor[GREEN], neutralColor[BLUE], 80);
								}
							}
						} else
						{
							//if (J3DCore.LOGGING()) Jcrpg.LOGGER.finest("WX "+(wX+x)+" - "+(wZ+z)+" "+c.cube);
							paintPointAllSides(staticLayerGraphics, x, z, 255, 255, 255, 70);
						}
					}
				}
			}
			
			for (Quad q:updatedQuads)
			{
				if (q.getLocalRenderState(RenderState.StateType.Texture)!=staticTexState) {
					q.setRenderState(staticTexState);
				}
			}
			
		} catch (Exception ex)
		{
			ex.printStackTrace();
		}
	}
	
	public LocalMap(World world, RenderedArea area) {
		this.area = area;
		this.world = world;
		
		staticLayer = new BufferedImage(localMapSizeY*pointSizeY, localMapSizeX*pointSizeX, BufferedImage.TYPE_4BYTE_ABGR);
		final byte data[] = AWTImageLoader.asByteArray(staticLayer);
		staticTexState = new TextureState();
		Texture2D tx = new Texture2D();
		ByteBuffer buff = BufferUtils.createByteBuffer(data.length);
		Image img = new Image(ImageDataFormat.RGBA, ImageDataType.Byte,  localMapSizeX*pointSizeX, localMapSizeY*pointSizeY, buff, null);
		tx.setImage(img);
		TextureKey rtt = TextureKey.getRTTKey(MinificationFilter.NearestNeighborNoMipMaps);
		tx.setTextureKey(rtt);
		staticTexState.setTexture(tx);
		
		staticLayerGraphics = staticLayer.getGraphics();
		
		
		update();
	}
	
	int lastCx = -1 , lastCy = -1 , lastCz = -1, lastDir = -1;
	
	public void update(int cx, int cy, int cz, int dir)
	{
		if (cx==lastCx && cy==lastCy && cz==lastCz && dir==lastDir) return;
		lastCx = cx;
		lastCy = cy;
		lastCz = cz;
		lastDir = dir;
		long t0 = System.currentTimeMillis();
		update();
		Jcrpg.LOGGER.finer("LOC MAP UPDATE = "+(System.currentTimeMillis()-t0));
		
	}

	public TextureState[] getMapTextures()
	{
		//staticTexState = new TextureState();//.getInstance().getDisplay().getRenderer().createTextureState();
		//staticTexState.setTexture(staticLayerTex);
		return new TextureState[]{staticTexState};
	}

	
}
