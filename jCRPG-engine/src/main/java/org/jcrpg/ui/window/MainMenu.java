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

import java.io.File;
import java.util.ArrayList;

import org.jcrpg.ui.KeyListener;
import org.jcrpg.ui.UIBase;
import org.jcrpg.ui.window.element.Button;
import org.jcrpg.ui.window.element.input.InputBase;
import org.jcrpg.ui.window.element.input.MenuImageButton;

import com.ardor3d.bounding.BoundingBox;
import com.ardor3d.math.ColorRGBA;
import com.ardor3d.renderer.queue.RenderBucketType;
import com.ardor3d.scenegraph.shape.Quad;

public class MainMenu extends InputWindow implements KeyListener {
	
	
	public static String QUIT = "mainmenu/mainMenuButtonQuit.png";
	public static String OPTIONS = "mainmenu/mainMenuButtonOptions.png";
	public static String NEW_GAME = "mainmenu/mainMenuButtonNewGame.png";
	public static String SAVE_GAME = "mainmenu/mainMenuButtonSaveGame.png";
	public static String LOAD_GAME = "mainmenu/mainMenuButtonLoadGame.png";
	
	public String[][] menuImages = new String[][] {
			{NEW_GAME,NEW_GAME}, {SAVE_GAME,SAVE_GAME}, {LOAD_GAME,LOAD_GAME}, {OPTIONS,OPTIONS}, {QUIT,QUIT}
	};
	public float[] sizeXRatios = new float[]{1f,0.5f,0.5f, 0.8f, 0.5f};
	
	int selected = 0;
	
	public ArrayList<Button> buttons = new ArrayList<Button>();
	
	
	public MainMenu(UIBase base) {
		super(base);
		
        try {
        	
        	Quad hudQuad = loadImageToQuad("mainmenu/mainMenu.dds", 0.8f*1.2f*core.getDisplay().getWidth() / 2, 1.4f*(core.getDisplay().getHeight() / 2), 
        			core.getDisplay().getWidth() / 2, 1.1f*core.getDisplay().getHeight() / 2);
        	hudQuad.setRenderState(base.hud.hudAS);
			windowNode.attachChildAt(hudQuad,0);
        	
			int counter = 0;
			float sizeX = 1.28f* 1.2f * core.getDisplay().getWidth() / 5f;
			float sizeY = 0.82f* (core.getDisplay().getHeight() / 11);
			float startPosY = 1.31f*core.getDisplay().getHeight() / 2;
			float stepPosY = 0.85f* 1.1f*(core.getDisplay().getHeight() / 11);
			float posX = core.getDisplay().getWidth() / 2;
			int i=0;
			for (String[] image:menuImages)
			{//
				Quad button = loadImageToQuad( image[1],sizeX*sizeXRatios[i],sizeY, posX, startPosY - stepPosY*counter++);
				button.setRenderState(base.hud.hudAS);
				button.setModelBound(new BoundingBox());
				MenuImageButton b = new MenuImageButton(image[1], this, windowNode, i);
				b.baseNode.attachChildAt(button,0);
				b.activate();
				windowNode.attachChildAt(b.baseNode,0);
				buttons.add(new Button(image[0],button,this));
				i++;
			}
			highlightSelected();
			base.addEventHandler("lookUp", this);
			base.addEventHandler("lookDown", this);
			base.addEventHandler("enter", this);
			base.addEventHandler("back", this);
		} catch (Exception ex) {
			ex.printStackTrace();
		}
	}
	
	
	
	public void highlightSelected()
	{
		for (int i=0; i<buttons.size(); i++)
		{
			Button b = buttons.get(i);
			if (i==selected)
			{
				b.quad.setSolidColor(ColorRGBA.WHITE);
						
			} else
			{
				b.quad.setSolidColor(ColorRGBA.GRAY);
				
			}
		}
		
	}

	boolean keepPlayingMusic = false;
	
	@Override
	public void hide() {
		//core.audioServer.stopMainMenu();
		//if (core.coreFullyInitialized) {
		if (!keepPlayingMusic) {
			core.audioServer.stopAndResumeOthers("main");
		} else
		{
			keepPlayingMusic = false;
		}
		//}
		core.getUIRootNode().detachChild(windowNode);
		lockLookAndMove(false);
	}
	

	@Override
	public void show() {
		if (core.audioServer!=null) core.audioServer.playOnlyThisMusic("main");
		core.getUIRootNode().attachChildAt(windowNode,0);
		lockLookAndMove(true);
	}

	public void handleChoice()
	{
		System.out.println("---SELECTED = "+selected);
		String name = buttons.get(selected).name;
		handleChoice(name);
	}
	public void handleChoice(String name)
	{
		if (name.equalsIgnoreCase(QUIT))
		{
			//
			core.doQuit();
		} else
		if (name.equalsIgnoreCase(NEW_GAME))
		{
			base.hud.characters.hide();
			keepPlayingMusic = true;
			toggle();
			core.partySetup.toggle();
			
		} else
		if (name.equalsIgnoreCase(SAVE_GAME))
		{
			if (!core.coreFullyInitialized) return;
			keepPlayingMusic = true;
			toggle();
			core.saveMenu.toggle();

		} else
		if (name.equalsIgnoreCase(LOAD_GAME))
		{
			keepPlayingMusic = true;
			if (LoadMenu.updateFromDirectory()) {
				toggle();
				core.loadMenu.toggle();
			}
		} else
		if (name.equalsIgnoreCase(OPTIONS))
		{
			keepPlayingMusic = true;
			toggle();
			core.optionsMenu.toggle();
		}
	}

	public boolean handleKey(String key) {
		if (!visible) return false;
		if (key.equals("lookUp"))
		{
			selected--;
		} else
		if (key.equals("lookDown"))
		{
			selected++;
		}
		if (key.equals("back"))
		{
			if (core.coreFullyInitialized) {
				toggle();
				core.audioServer.stopAndResumeOthers("main");
				return true;
			}
		}
		selected = selected%buttons.size();
		if (selected<0) selected = buttons.size()-1;
		highlightSelected();
		
		if (key.equals("enter"))
		{
			handleChoice();
		}
		
		return true;
		//return false;
	}

	@Override
	public boolean inputChanged(InputBase base, String message) {
		// TODO Auto-generated method stub
		return false;
	}



	@Override
	public boolean inputEntered(InputBase base, String message) {
		int newSelected = Integer.parseInt(message);
		if (newSelected != selected)
		{
			selected = newSelected;
			highlightSelected();
			return true;
		}
		return false;
	}



	@Override
	public boolean inputLeft(InputBase base, String message) {
		// TODO Auto-generated method stub
		return false;
	}



	@Override
	public boolean inputUsed(InputBase base, String message) {
		if ("enter".equals(message)) {

			String name = base.baseNode.getChild(0).getName();
			System.out.println("INPUT USED "+name);
			/*if (name != null) {
				name = name.toLowerCase().substring(name.toLowerCase().lastIndexOf(File.separator) + 1);
			}*/
			handleChoice(name);
		}
		return false;
	}
	

}
