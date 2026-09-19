/*
 *  This file is part of JavaCRPG.
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
import java.util.HashSet;
import java.util.Map.Entry;

import org.jcrpg.apps.Jcrpg;
import org.jcrpg.threed.J3DCore;
import org.jcrpg.ui.window.element.input.InputBase;

import com.ardor3d.util.resource.MultiFormatResourceLocator;
import com.ardor3d.util.resource.ResourceLocatorTool;

public class UIBase {

	public J3DCore core;
	
	public HUD hud;
	public HashMap<String,Window> windows = new HashMap<String, Window>();
	public HashMap<String,HashSet<KeyListener>> eventToElements = new HashMap<String, HashSet<KeyListener>>(); // TODO multiple listeners can handle one key string!!
	
	public HashSet<Window> activeWindows = new HashSet<Window>(); 
	
	
	SimpleKeyEvents events; 
	
	public static final String RES_TYPE_UI = "ui";
	public static final String RES_TYPE_CHARS = "chars";
	public static final String RES_TYPE_GAME_2D = "items";
	
	public UIBase(J3DCore core) throws Exception
	{
		if (J3DCore.SETTINGS.DISABLE_DDS)
		{
			ResourceLocatorTool.addResourceLocator(RES_TYPE_UI, new MultiFormatResourceLocator( new File("../media/ui/").toURI(), ".png",".jpg"));
			
		} else
		{
			ResourceLocatorTool.addResourceLocator(RES_TYPE_UI, new MultiFormatResourceLocator( new File("../media/ui/").toURI(), ".dds",".png",".jpg"));
		}
		ResourceLocatorTool.addResourceLocator(RES_TYPE_CHARS, new MultiFormatResourceLocator( new File("../media/portraits/").toURI(), ".dds",".png",".jpg"));
		ResourceLocatorTool.addResourceLocator(RES_TYPE_CHARS, new MultiFormatResourceLocator( new File("../media/portraits/").toURI(), ".dds",".png",".jpg"));
		ResourceLocatorTool.addResourceLocator(RES_TYPE_GAME_2D, new MultiFormatResourceLocator( new File("../media/textures/icons/objects/").toURI(), ".dds",".png",".jpg"));
		this.core = core;
		events = new SimpleKeyEvents();
		hud = new HUD(new HUDParams(),this, core);
		if (core.audioServer!=null) core.audioServer.addTrack(InputBase.SOUND_INPUTSELECTED, "../media/audio/sound/ui/input_selected.ogg");
	}
	public void addWindow(String trigger, Window window)
	{
		windows.put(trigger, window);
	}
	public void removeWindow(Window window)
	{
		for (Entry<String, HashSet<KeyListener>> e:eventToElements.entrySet())
		{
			for (KeyListener kl:e.getValue())
			{
				if (kl.equals(window))
				{
					e.getValue().remove(kl);
					break;
				}
			}
		}
		
	}
	public boolean handleWindowEvent(String trigger)
	{
		if (Window.windowCounter>0) {
			Window w = windows.get(trigger);
			if (w!=null)
			if (!core.gameLost && (core.coreFullyInitialized || w==core.charSheetWindow) &&  // main menu shouldn't be toggled if not initialized
					w.equals(activeWindows.iterator().next())) 
			{
				w.toggle();
				return true;
			}
			return false;
		}
		if (windows.get(trigger)==null) return false;
		windows.get(trigger).toggle();
		return true;
	}
	public boolean handleEvent(String key)
	{
		if (J3DCore.LOGGING()) Jcrpg.LOGGER.fine("uiBase: handleEvent "+key);
		if (eventToElements.get(key)!=null)
		{
			HashSet<KeyListener> set = eventToElements.get(key);
			for (KeyListener w:set)
			{
				if (activeWindows.contains(w))
				{
					if (((KeyListener)w).handleKey(key)) {
						return true;
					}
				}
			}
		}
		if ((activeWindows==null || activeWindows.size()==0) && events.handleKey(key)) return true;
		return false;
	}
	public void addEventHandler(String key, KeyListener listener)
	{
		//if (J3DCore.LOGGING()) Jcrpg.LOGGER.finest("################## "+listener+" --- "+key);
		if (eventToElements.get(key)==null)
		{
			eventToElements.put(key, new HashSet<KeyListener>());
		}
		eventToElements.get(key).add(listener);
	}
}
