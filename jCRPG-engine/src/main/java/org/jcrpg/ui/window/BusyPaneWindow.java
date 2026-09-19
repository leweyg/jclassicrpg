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

package org.jcrpg.ui.window;

import java.util.HashMap;
import java.util.Iterator;
import java.util.Random;

import org.jcrpg.ui.FontUtils;
import org.jcrpg.ui.KeyListener;
import org.jcrpg.ui.UIBase;
import org.jcrpg.ui.window.element.TextLabel;
import org.jcrpg.ui.window.element.input.InputBase;

import com.ardor3d.math.FastMath;
import com.ardor3d.scenegraph.shape.Quad;

/**
 * Used to hide loading and such behind a quad.
 * @author illes
 *
 */
public class BusyPaneWindow extends InputWindow implements KeyListener {
	
	//FontTT text;
	
	Quad upper, lower;
	Quad economyQuad;
	
	String defType;
	
	HashMap<String, HashMap<String, Quad>> images = new HashMap<String, HashMap<String,Quad>>();
	
	TextLabel label = null;
	
	public BusyPaneWindow(UIBase base, HashMap<String, String[]> map, String defaultType) {
		super(base);
		defType = defaultType;
		//text = FontUtils.textVerdana;
        try {
        	
        	for (String key:map.keySet())
        	{
        		for ( String image:map.get(key) )
        		{ 
        			Quad q = loadImageToQuad(image, core.getDisplay().getWidth(), core.getDisplay().getHeight(), 
                			core.getDisplay().getWidth() / 2, core.getDisplay().getHeight() / 2);
                	HashMap<String, Quad> iMap = images.get(key);
                	if (iMap==null) {
                		iMap = new HashMap<String, Quad>();
                		images.put(key, iMap);
                	}
                	iMap.put(image, q);
        		}
        	}
        	
        	upper = loadImageToQuad("busy/back.png", core.getDisplay().getWidth(), core.getDisplay().getHeight()/30f, 
        			core.getDisplay().getWidth() / 2, (core.getDisplay().getHeight() / 30f) * 29.5f);
        	upper.setRenderState(base.hud.hudAS);
        	lower = loadImageToQuad("busy/back.png", core.getDisplay().getWidth(), core.getDisplay().getHeight()/30f, 
        			core.getDisplay().getWidth() / 2, (core.getDisplay().getHeight() / 30f) * 0.5f);
        	lower.setRenderState(base.hud.hudAS);
 
			
			
			label = new TextLabel("busy",this,windowNode,0.5f, 0.5f, 0.35f, 0.15f,600f,"",true);
        	setToType(defaultType, "Please wait...");
		} catch (Exception ex) {
			ex.printStackTrace();
		}
	}
	
	@Override
	public void hide() {
		super.hide();
		core.getClassicInputHandler().switchUIMode(false);
	}
	
	public static final String LOADING = "L";
	public static final String ECONOMY = "E";
	
	public void setToType(String type, String text)
	{
		HashMap<String, Quad> qs= images.get(type);
		int i = new Random().nextInt(qs.size()-1)%qs.size();
		Iterator<Quad> it = qs.values().iterator();
		Quad q = null;
		for (int j=0; j<=i; j++)
		{
			q = it.next();
		}
		windowNode.detachAllChildren();
		windowNode.attachChildAt(q,0);
		windowNode.attachChildAt(upper,0);
		windowNode.attachChildAt(lower,0);
		label.setValue(text);
		label.text = text;
		label.setUpdated(true);
		windowNode.attachChildAt(label.baseNode,0);
		label.activate();
	}

	@Override
	public void show() {
		core.getClassicInputHandler().switchUIMode(true);
		super.show();
	}
	
	public boolean handleKey(String key) {
		return true;
	}
	@Override
	public boolean inputEntered(InputBase base, String message) {
		// TODO Auto-generated method stub
		return false;
	}
	@Override
	public boolean inputLeft(InputBase base, String message) {
		// TODO Auto-generated method stub
		return false;
	}
	@Override
	public boolean inputUsed(InputBase base, String message) {
		// TODO Auto-generated method stub
		return false;
	}
	



}
