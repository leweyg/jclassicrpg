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

package org.jcrpg.ui.meter;

import java.io.File;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;

import org.jcrpg.threed.J3DCore;
import org.jcrpg.threed.PooledSharedNode;
import org.jcrpg.threed.engine.ui.ZoomingNode;
import org.jcrpg.ui.HUD;
import org.jcrpg.ui.Window;

import com.ardor3d.math.ColorRGBA;
import com.ardor3d.math.Vector3;
import com.ardor3d.scenegraph.Mesh;
import com.ardor3d.scenegraph.Node;
import com.ardor3d.scenegraph.shape.Quad;
import com.ardor3d.ui.text.BasicText;

public class EntityOMeter {

	public HUD hud;
	
	public static HashMap<String, Quad> entityPics = new HashMap<String, Quad>();
	
	public Node node = new Node();
	
	public float iconSizeX = 10f;
	
	public EntityOMeter(HUD hud) throws Exception
	{
		this.hud = hud;
		iconSizeX = hud.core.getDisplay().getWidth()/15;
	}
	
	private void updateText(ZoomingNode node,int vertPos, String textId, String textToPrint)
	{
		String t = textToPrint;
		if (t.length()>6)
		{
			t = t.substring(0,6);
		}
		BasicText text = (BasicText)node.getChild(textId);
		BasicText textBg = (BasicText)node.getChild(textId+"bg");
		if (text == null)
		{
			{
				textBg = org.jcrpg.ui.BasicText.createDefaultTextLabel(textId+"bg", t);
				textBg.setTextColor(ColorRGBA.BLACK);
				textBg.setScale(J3DCore.getInstance().getDisplay().getWidth()/1224f);
				textBg.setTranslation(-1*J3DCore.getInstance().getDisplay().getWidth()/40.2f, -vertPos* J3DCore.getInstance().getDisplay().getHeight()/60f, 0f);
				node.attachChildAt(textBg,0);
			}
			{
				text = org.jcrpg.ui.BasicText.createDefaultTextLabel(textId, t);
				text.setScale(J3DCore.getInstance().getDisplay().getWidth()/1224f);
				text.setTranslation(-1*J3DCore.getInstance().getDisplay().getWidth()/40f, -vertPos* J3DCore.getInstance().getDisplay().getHeight()/60f, 0f);
				node.attachChildAt(text,0);
			}
		} else
		{
			textBg.setText(t);
			text.setText(t);
		}
	}
	
	private ArrayList<EntityOMeterData> previousEntityPics = new ArrayList<EntityOMeterData>();
	private ArrayList<ZoomingNode> previousNodes = new ArrayList<ZoomingNode>();
	public void update(Collection<EntityOMeterData> entityPics)
	{
		//hud.hudNode.detachChild(node);
		//node.detachAllChildren();
		ArrayList<ZoomingNode> newNodes = new ArrayList<ZoomingNode>();
		int count = 0;
		for (EntityOMeterData data:entityPics)
		{
			String p = data.picture;
			String text = data.kind;
			String text1 = "d "+(data.dist==null?"?":""+((int)data.dist.floatValue()));
			String text2 = "a "+ (data.angle==null?"?":""+((int)data.angle.floatValue()));
			if (count>4) break;
			ZoomingNode n = null;
			if (previousEntityPics.contains(data)) 
			{
				int index = previousEntityPics.indexOf(data);
				n = previousNodes.get(index);
			} else
			{
				Quad q = loadQuad(p);
				
				if (q==null) continue;
				
				Mesh sq = PooledSharedNode.copyMesh(""+p,q);
				//sq.setLocalScale(1,1,1);
				n = new ZoomingNode();
				n.attachChildAt(sq,0);
				node.attachChildAt(n,0);
				n.startZoomCycle();
			}
			updateText(n, 0,"text",text);
			updateText(n, 1,"text1",text1);
			updateText(n, 2,"text2",text2);
			newNodes.add(n);
			n.setTranslation(new Vector3(hud.core.getDisplay().getWidth()/1.66f+count*iconSizeX , hud.core.getDisplay().getHeight()/16.6f,0));
			count++;
		}
		previousNodes.removeAll(newNodes);
		for (ZoomingNode n:previousNodes) {n.removeFromParent();}
		previousEntityPics.clear();
		previousEntityPics.addAll(entityPics);
		previousNodes = newNodes;
		hud.hudNode.attachChildAt(node,0);
	}
	
	public Quad loadQuad(String pic)
	{
		
		Quad q = null;
		q = entityPics.get(pic);
		if (q==null)
		{
			try {
				q = Window.loadImageToZoomingQuad(new File("../media/textures/icons/entities/"+pic+".png"), hud.core.getDisplay().getWidth()/18, hud.core.getDisplay().getHeight()/14,0, 0);
				entityPics.put(pic, q);
			} catch (Exception ex)
			{
			}
		}

		return q;
	}
	
}
