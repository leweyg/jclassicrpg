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

package org.jcrpg.ui;

import java.io.File;
import java.util.ArrayList;
import java.util.StringTokenizer;

import org.jcrpg.threed.J3DCore;
import org.jcrpg.threed.engine.ui.ZoomingQuad;
import org.jcrpg.world.ai.EntityMemberInstance;

import com.ardor3d.bounding.BoundingBox;
import com.ardor3d.math.Vector3;
import com.ardor3d.renderer.queue.RenderBucketType;
import com.ardor3d.scenegraph.Node;
import com.ardor3d.scenegraph.hint.CullHint;
import com.ardor3d.scenegraph.hint.TextureCombineMode;
import com.ardor3d.scenegraph.shape.Quad;
import com.ardor3d.ui.text.BasicText;

public abstract class Window {

	protected boolean visible = false;
	public Node windowNode;
	
	public UIBase base;
	public J3DCore core;
	
	public static int windowCounter = 0;
	
	public Window(UIBase base)
	{
		this.base = base;
		core = base.core;
		init();
	}
	public void init()
	{
		windowNode = new Node("windowNode "+this.getClass());
	}
	boolean storedEnginePauseState = false; 
	public synchronized void toggle()
	{
		if (visible)
		{
			core.gameState.engine.setPause(storedEnginePauseState);
			windowCounter--;
			if (windowCounter==0) base.core.getClassicInputHandler().switchUIMode(false);
			core.setFlare(true);
			base.activeWindows.remove(this);
			base.core.getClassicInputHandler().setUIRootNode(null);
			hide();
		} else
		{
			windowCounter++;
			base.core.getClassicInputHandler().switchUIMode(true);
			storedEnginePauseState = core.gameState.engine.isPause();
			core.setFlare(false);
			core.gameState.engine.setPause(true);
			base.activeWindows.add(this);
			base.core.getClassicInputHandler().setUIRootNode(windowNode);
			windowNode.updateWorldBound(true);
			show();
		}
		visible=!visible;
	}
	public static Quad loadImageToQuad(String fileName, double sizeX, double sizeY,
			double posX, double posY) throws Exception {
		Quad hudQuad = UIImageCache.getImage(fileName, true, sizeX, sizeY);
		
		hudQuad.getSceneHints().setRenderBucketType(RenderBucketType.Ortho);

		hudQuad.setTranslation(new Vector3(posX, posY, 0));
		return hudQuad;

	}	
	
	
	
	public static Quad loadImageToQuad(File file, double sizeX, double sizeY,
			double posX, double posY) throws Exception {
		
		Quad hudQuad = UIImageCache.getImage(file.getPath(), true, sizeX, sizeY);
	
		hudQuad.getSceneHints().setRenderBucketType(RenderBucketType.Ortho);

		hudQuad.setTranslation(new Vector3(posX, posY, 0));
		hudQuad.setModelBound(new BoundingBox());

		return hudQuad;
	}
	public static Quad loadImageToQuadDirectly(File file, double sizeX, double sizeY,
			double posX, double posY) throws Exception {
		
		Quad hudQuad = UIImageCache.getImageDirectlyFromFile(file.getPath(), true, sizeX, sizeY);
	
		hudQuad.getSceneHints().setRenderBucketType(RenderBucketType.Ortho);

		hudQuad.setTranslation(new Vector3(posX, posY, 0));
		hudQuad.setModelBound(new BoundingBox());

		return hudQuad;
	}
	/**
	 * 
	 * @param resType ResourceLocator type
	 * @param file
	 * @param sizeX
	 * @param sizeY
	 * @param posX
	 * @param posY
	 * @return
	 * @throws Exception
	 */
	public static Quad loadImageToQuad(String resType, String file, double sizeX, double sizeY,
			double posX, double posY) throws Exception {
		
		Quad hudQuad = UIImageCache.getImage(file, true, sizeX, sizeY);
	
		hudQuad.getSceneHints().setRenderBucketType(RenderBucketType.Ortho);

		hudQuad.setTranslation(new Vector3(posX, posY, 0));
		hudQuad.setModelBound(new BoundingBox());

		return hudQuad;
	}

	public static ZoomingQuad loadImageToZoomingQuad(File file, double sizeX, double sizeY,
			double posX, double posY) throws Exception {
		
		ZoomingQuad hudQuad = UIImageCache.getImageZoomingQuad(file.getPath(), true, sizeX, sizeY);
	
		hudQuad.getSceneHints().setRenderBucketType(RenderBucketType.Ortho);

		hudQuad.setTranslation(new Vector3(posX, posY, 0));

		return hudQuad;
	}
	
	int lockers = 0;
	
	public synchronized void lockLookAndMove(boolean value)
	{
		if (value) {
			lockers++;
		} else
		{
			lockers--;
		}
		if (value || !value && lockers == 0) 
		{
			// TODO ardor3d input! ((ClassicKeyboardLookHandler)core.getInputHandler().getFromAttachedHandlers(0)).lock = value;
		}
	}
	
	public abstract void hide();
	public abstract void show();

	/**
	 * Call this back if portrait is 'used' (clicked etc.)
	 * @param count Number of member in party
	 * @param member Member object
	 * @param secondaryWay Was it a secondary input
	 */
	public void characterSelected(int count, EntityMemberInstance member, int inputType)
	{
		// 
	}
	
	public class TooltipBox
	{
		
		public Node tooltipNode = new Node();
		public Node ttTextBaseNode = new Node();
		public final float ttXSizeRatio = 0.45f;
		public final float ttYSizeRatio = 0.18f;
		public final float ttXPosRatio = 0.73f;
		public final float ttYPosRatio = 0.93f;
		
		public final float fontSizeRatio = 0.0087f;
		public final float fontYSizeRatio = 0.023f;
		
		public final float fontRealRowDispositionUnit;
		public final float fontRealColumnDispositionUnit;
		private float xSize = 0f;
		private float ySize = 0f;
		private float xPos = 0f;
		private float yPos = 0f;
		
		private int lettersX, lettersY;
		
		Quad bgImage;
		BasicText[] lines = null;
		
		public TooltipBox() throws Exception 
		{
			int width = J3DCore.getInstance().getDisplay().getWidth();
			int height = J3DCore.getInstance().getDisplay().getHeight();
			xSize = width * ttXSizeRatio;
			ySize = height * ttYSizeRatio;
			xPos = width * ttXPosRatio;
			yPos = width * (1f-ttYPosRatio);
			
			fontRealRowDispositionUnit = height * fontYSizeRatio;
			fontRealColumnDispositionUnit = width * fontSizeRatio;
			
			lettersX = (int)(ttXSizeRatio/fontSizeRatio);
			lettersY = (int)(ttYSizeRatio/fontYSizeRatio);
			lines = new BasicText[lettersY];
			for (int i=0; i<lines.length; i++)
			{
				lines[i] = org.jcrpg.ui.BasicText.createDefaultTextLabel("tt_line"+i,"");
				lines[i].getSceneHints().setCullHint(CullHint.Never );
				lines[i].getSceneHints().setTextureCombineMode( TextureCombineMode.Replace );
				lines[i].setTranslation(-1*(lettersX/1.95f) * fontRealColumnDispositionUnit, (+1*((lettersY-1.5f)/2f) - i)*fontRealRowDispositionUnit,0);
				//lines[i].setLocalScale(0.8f);
				lines[i].setScale(width/1024f * 0.75f);
				ttTextBaseNode.attachChildAt(lines[i],0);
			}
			
			bgImage = loadImageToQuad("dark_mask.png", xSize, ySize, xPos, yPos);
			ttTextBaseNode.setTranslation(xPos, yPos, 0);
			if (ttTextBaseNode.getParent()==null)
			{
				tooltipNode.attachChildAt(bgImage,0);
				tooltipNode.attachChildAt(ttTextBaseNode,0);
			}
		}
		
		
		
		public String[] wrapText(String text)
		{
			int wrapLimit = lettersX;
			StringTokenizer st = new StringTokenizer(text," ");
			
			ArrayList<String> lines = new ArrayList<String>();
			String currentLine = "";
			while (st.hasMoreTokens())
			{
				String token = st.nextToken();
				if (currentLine.length()+token.length()>wrapLimit)
				{
					if (currentLine.length()<wrapLimit*0.3f)
					{
						String firstPart = token.substring(0,(int)(wrapLimit*0.7f));
						currentLine=currentLine+" "+firstPart;
						lines.add(currentLine);
						token = token.substring((int)(wrapLimit*0.7f));
					} else
					{
						lines.add(currentLine);
					}
					currentLine = "";
				}
				currentLine+=" "+token;
			}
			lines.add(currentLine);
			return lines.toArray(new String[0]);
		}
		
		public void toggleTooltip(String text, Node parent)
		{
			if (text==null)
			{
				tooltipNode.removeFromParent();
			} else
			{
				String[] lines = wrapText(text);
				for (int i=0; i<lines.length; i++)
				{
					if (i<lettersY)
					{
						this.lines[i].setText(lines[i]);
					}
				}
				for (int i=lines.length; i<this.lines.length; i++)
				{
					this.lines[i].setText("");
				}
				parent.attachChildAt(tooltipNode,0);
			}
		}
	}
	
	public TooltipBox tooltipBox = null;
	
	public void toggleTooltip(String text)
	{
		if (tooltipBox==null)
		{
			try {
			tooltipBox = new TooltipBox();} catch (Exception ex){ex.printStackTrace();}
		}
		if (tooltipBox!=null)
		tooltipBox.toggleTooltip(text, windowNode);
	}
	
	public void updateTooltipPos(double ratioX, double ratioY)
	{
		
	}
	
	
	
}
