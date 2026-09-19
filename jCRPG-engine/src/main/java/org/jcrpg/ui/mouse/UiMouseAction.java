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

import java.util.ArrayList;
import java.util.HashSet;
import java.util.Set;
import java.util.logging.Logger;

import org.jcrpg.threed.J3DCore;
import org.jcrpg.ui.mouse.UiMouseEvent.UiMouseEventType;
import org.jcrpg.ui.window.element.input.InputBase;
import org.jcrpg.ui.window.element.input.InputBase.UI_ELEMENT_SPEC;

import com.ardor3d.bounding.BoundingBox;
import com.ardor3d.bounding.BoundingSphere;
import com.ardor3d.input.ButtonState;
import com.ardor3d.input.MouseButton;
import com.ardor3d.input.logical.TwoInputStates;
import com.ardor3d.math.Vector3;
import com.ardor3d.scenegraph.Node;
import com.ardor3d.scenegraph.Spatial;

/**
 * <code>UiMouseAction</code> defines a mouse action that detects mouse events
 * and converts it into UiMouseEvents for UI objects.
 * 
 * @version $Id$
 * @author mkienenb
 * @author paul.illes
 **/
public class UiMouseAction  {

	    private static final int JME_LEFT_BUTTON = 0;
		private static final int JME_RIGHT_BUTTON = 1;
	 
		private static Logger logger = Logger.getLogger(UiMouseAction.class.getName());
		
	     private Node rootNode;
	     private Node secondaryFocusNode;
	     
		    private UiMouseEventImpl lastMouseEvent = new UiMouseEventImpl(UiMouseEvent.UiMouseEventType.MOUSE_INFO, Integer.MIN_VALUE, Integer.MIN_VALUE);
		    private UiMouseEventImpl lastMouseEventSecondary = new UiMouseEventImpl(UiMouseEvent.UiMouseEventType.MOUSE_INFO, Integer.MIN_VALUE, Integer.MIN_VALUE);
	    private boolean insideInputBase = false; 
	    private HashSet<InputBase> enteredInputBaseList = new HashSet<InputBase>();
	    
	     /**
	     * @param mouse the jme input mouse to use for mouse events
	      */
	    public UiMouseAction() {
	     }
	 
	    boolean mouseLookSwitcherUp = true;
	    
	     /**
	      * <code>performAction</code> generates mouse events
	      * 
	      * @see com.jme.input.action.MouseInputAction#performAction(InputActionEvent)
	      */
	     public synchronized boolean performAction(TwoInputStates evt) {
	     	if (rootNode==null) 
	     	{
	     		if (!J3DCore.getInstance().getClassicInputHandler().isUIEnabled())
	     		{
	     			// no mouse look, no window, check for secondary elements of HUD
		    		if (secondaryFocusNode!=null && secondaryFocusNode.getParent()!=null)
		    		{
		    			if (!mousePick(secondaryFocusNode,lastMouseEventSecondary,evt))
		    			{
		    				// mouse pick happened...
		    				return true;
		    			}
		    		}
	     		}
	     		// no pick
	     		return false;
	     	}
	     	
	    	if (mousePick(rootNode,lastMouseEvent,evt))
	    	{
	    		// no pick on window, secondary elements picking...
	    		if (secondaryFocusNode!=null && secondaryFocusNode.getParent()!=null)
	    		{
	    			if (!mousePick(secondaryFocusNode,lastMouseEventSecondary,evt))
	    			{
	    				// pick
	    				return true; 
	    			}
	    		}
	    		// no pick happened
	    		return false;
	    	}
	 
	    	// no mousepick
	    	return true;
	     }

	     /**
	      * 
	      * @param rootNode
	      * @return true if nothing is picked.
	      */
	     private synchronized boolean mousePick(Node rootNode, UiMouseEventImpl lastMouseEvent,TwoInputStates evt) {
	 	    ArrayList<PickedSpatialInfo> picked = new ArrayList<PickedSpatialInfo>();
	 	    ArrayList<Spatial> loop = new ArrayList<Spatial>();
	
		    int mouseEventX = evt.getCurrent().getMouseState().getX();
		    int mouseEventY = evt.getCurrent().getMouseState().getY();
		    UiMouseEventImpl mouseEvent = new UiMouseEventImpl(UiMouseEvent.UiMouseEventType.MOUSE_INFO, mouseEventX, mouseEventY);
	        if (evt.getCurrent().getMouseState().getButtonsClicked().contains(MouseButton.LEFT))
	        {
	        	mouseEvent.setButtonPressed(UiMouseEvent.BUTTON_LEFT);
	        }
	    	if (evt.getCurrent().getMouseState().getButtonState(MouseButton.LEFT)==ButtonState.DOWN)
	    	{
	    		if (evt.getCurrent().getMouseState().getDx()!=0 || evt.getCurrent().getMouseState().getDy()!=0)
	    		{
	    			mouseEvent.setButtonPressed(UiMouseEvent.BUTTON_LEFT);
	    		}
	    	}
	        if (evt.getCurrent().getMouseState().getButtonsClicked().contains(MouseButton.RIGHT))
	        {
	        	mouseEvent.setButtonPressed(UiMouseEvent.BUTTON_RIGHT);
	        }
	
//	        System.out.println("PICKING STARTED: "+rootNode.getName());
			pickUI(picked, loop, rootNode, mouseEvent.getX(), mouseEvent.getY());
	
		    Set<InputBase> pickedInputBaseSet = new HashSet<InputBase>();
			for (PickedSpatialInfo p:picked)
	 	    {
	 	    	Node parent = (Node)p.spatial.getParent();
	 	    	InputBase base = ((UI_ELEMENT_SPEC)parent.getUserData()).input;
	 	    	if (base.isActive())
	 	    	{
	 	    		// if there's an active UI element, it should rule out other picked UI elements under/near itself!
	 	    		pickedInputBaseSet.clear(); // ... so clear others
			    	pickedInputBaseSet.add(base); // add only this
			    	break; // and break.
	 	    	}
		    	pickedInputBaseSet.add(base);
		    }
	
			mouseEvent.setPickedSpatialList(picked);
			mouseEvent.setPickedInputBaseSet(pickedInputBaseSet);

			boolean keepMouseCursorIntact = false;
			boolean exited = false;
			
		    for (InputBase lastEventInputBase: lastMouseEvent.getPickedInputBaseSet())
		    {
		    	if (!mouseEvent.getPickedInputBaseSet().contains(lastEventInputBase))
	 	    	{
			    	// Notify old event inputBaseSet of MOUSE_EXITED
			    	if (insideInputBase && lastEventInputBase.isEnabled())
			    	{
			    		sendCustomizedMouseEvent(lastEventInputBase,
			            		mouseEvent, UiMouseEventType.MOUSE_EXITED);
			    		exited = true;
			    		enteredInputBaseList.remove(lastEventInputBase);
			    		
			    		insideInputBase = false; // preventing recurring 'exiting' event when current event is just equal to the previous.
			    	}
	 	    	}
		    	//lastMouseEvent.removePickedInputBase(lastEventInputBase);
	 	    }
			if (pickedInputBaseSet.size()==0) 
			{
		    	if (exited) UiMouseHandler.normalCursor();
			    lastMouseEvent.loadFromOther(mouseEvent);
				return true;
			}
		    //boolean eventHandled = false;
			
		    // NOTE: currently isEquivalent is true even if scene graph changed.
		    //if (!mouseEvent.isEquivalentTo(lastMouseEvent))
		    {
			    for (InputBase inputBase:pickedInputBaseSet)
			    {
			    	if (inputBase.isEnabled())
			    	{
			    		// Send MOUSE_ENTERED event to previous inputBases in addition to any other mouse events
				    	if (!lastMouseEvent.getPickedInputBaseSet().contains(inputBase))
				    	{
				    		if (enteredInputBaseList.size()>0)
				    		{
				    			for (InputBase lastInputBase:enteredInputBaseList)
				    			{
				    				System.out.println("EXITED "+lastInputBase);
				    				sendCustomizedMouseEvent(lastInputBase,
				    					mouseEvent, UiMouseEventType.MOUSE_EXITED);
				    			}
				    		}
				    		enteredInputBaseList.clear();
					    	// Notify new event inputBaseSet of MOUSE_ENTERED
		    				System.out.println("ENTERED "+inputBase);
				    		keepMouseCursorIntact = keepMouseCursorIntact || sendCustomizedMouseEvent(inputBase,
				            		mouseEvent, UiMouseEventType.MOUSE_ENTERED);
				    		insideInputBase = true;
				    		enteredInputBaseList.add(inputBase);
				    		//eventHandled = true;
				    	}
				    	
				    	// Now send one more current event
				    	
				    	// TODO: this treats all pressed mouse buttons as equivalent.
				    	// Should events change if the pressed button changes? For example, if we switch
				    	// from left-button-down, right-button-up to left-button-down, right-button-down
				    	// then to left-button-up, right-button-down?  The current algorithm is
				    	// kinder and more forgiving to end-users, and I've seen it used elsewhere.
	
				    	/*if ( (lastMouseEvent.isButtonPressed(UiMouseEvent.BUTTON_ANY))
				    	      && (mouseEvent.isButtonPressed(UiMouseEvent.BUTTON_NONE)) )
				    	{
					    	// Notify new event inputBaseSet of MOUSE_RELEASED -- only sent once
				    		keepMouseCursorIntact = keepMouseCursorIntact || sendCustomizedMouseEvent(inputBase,
				            		mouseEvent, UiMouseEventType.MOUSE_RELEASED);
				    		//eventHandled = true;
				    	}
				    	else if ( (lastMouseEvent.isButtonPressed(UiMouseEvent.BUTTON_NONE))
					    	      && (mouseEvent.isButtonPressed(UiMouseEvent.BUTTON_ANY)) )*/
				    	if (mouseEvent.isButtonPressed(UiMouseEvent.BUTTON_ANY))
				    	{
					    	// Notify new event inputBaseSet of MOUSE_PRESSED -- only sent once
				    		keepMouseCursorIntact = keepMouseCursorIntact || sendCustomizedMouseEvent(inputBase,
				            		mouseEvent, UiMouseEventType.MOUSE_PRESSED);
				    		//eventHandled = true;
				    	}
				    	/*
				    	else if ( (lastMouseEvent.isButtonPressed(UiMouseEvent.BUTTON_ANY))
					    	      && (mouseEvent.isButtonPressed(UiMouseEvent.BUTTON_ANY)) )
				    	{
				    		// TODO: This should probably have a minimum coordinate delta change before being triggered.
					    	// Notify new event inputBaseSet of MOUSE_DRAGGED -- sent continually while button remains pressed
				    		keepMouseCursorIntact = keepMouseCursorIntact || sendCustomizedMouseEvent(inputBase,
				            		mouseEvent, UiMouseEventType.MOUSE_DRAGGED);
				    		//eventHandled = true;
				    	}*/
				    	else
				    	{
					    	// Notify new event inputBaseSet of normal mouse moved event
				    		keepMouseCursorIntact = keepMouseCursorIntact || sendCustomizedMouseEvent(inputBase,
				            		mouseEvent, UiMouseEventType.MOUSE_MOVED);
				    		//eventHandled = true;
				    	}
				    	// TODO: consider generating a double-click event or perhaps indicating
				    	// how many clicks have occurred within a certain timeframe in the event?
				    	// Or leave this for the inputBase event handler to compute from timestamp and mouse presses?
			    	} else
			    	{
			    		//mouseEvent.removePickedInputBase(inputBase);
			    	}
			    }
			    if (!keepMouseCursorIntact)
			    {
			    	UiMouseHandler.normalCursor();
			    }
		    } //else
		    {
		    }
		    lastMouseEvent.loadFromOther(mouseEvent);
		    return false;
		}
	
		private boolean sendCustomizedMouseEvent(InputBase inputBase, UiMouseEvent mouseEvent, UiMouseEventType mouseEventType) {
			//System.out.println("-- EVENT: "+mouseEvent);
			int translatedX = mouseEvent.getX();
			int translatedY = mouseEvent.getY();
			
			UiMouseEvent customizedMouseEvent = new UiMouseEventCustomizedWrapper(mouseEvent,
					mouseEventType, translatedX, translatedY);
			return sendMouseEvent(inputBase , customizedMouseEvent);
		}
		
		private boolean sendMouseEvent(InputBase inputBase, UiMouseEvent mouseEvent) {
			if (!inputBase.handleMouse(mouseEvent) || mouseEvent.getEventType()==UiMouseEventType.MOUSE_EXITED)
			{
				return false;//
			}
			return true;
	 	}
	
		
	public class PickedSpatialInfo
	{
		public double ratioX, ratioY;
		public double absSizeX, absSizeY;
		public Spatial spatial;
	}
		
	/**
	 * jcrpg specific UI picking
	 * @author paul.illes
	 * @param list
	 * @param loopDetection
	 * @param node
	 * @param hitX
	 * @param hitY
	 */
	private void pickUI(ArrayList<PickedSpatialInfo> list, ArrayList<Spatial> loopDetection, Node node, int hitX, int hitY)
	{
	    for (Spatial s:node.getChildren())
	    {
	    	if (s.getWorldBound()!=null)
	    	{
	    		double x = 0;
	    		double y = 0;
	    		double x2 = 0;//x+v.getX()*2;
	    		double y2 = 0;//y+v.getY()*2;
	    		if (s.getWorldBound() instanceof BoundingBox)
	    		{
	    			BoundingBox b = (BoundingBox)s.getWorldBound();
		    		 x = b.getCenter().getX();
		    		 y = b.getCenter().getY();
		    		Vector3 v = b.getExtent(null);
		    		x -= v.getX();
		    		y -= v.getY();
		    		 x2 = x+v.getX()*2;
		    		 y2 = y+v.getY()*2;
	    		} else
	    		if (s.getWorldBound() instanceof BoundingSphere)
	    		{
	    			BoundingSphere b = (BoundingSphere)s.getWorldBound();
		    		 x = b.getCenter().getX();
		    		 y = b.getCenter().getY();
		    		double v = b.getRadius();
		    		x -= v;
		    		y -= v;
		    		 x2 = x+v*2;
		    		 y2 = y+v*2;
	    			
	    		}
	    		if (x<=hitX && y<=hitY && x2>=hitX && y2>=hitY)
	    		{
    				if (s.getParent()!=null && InputBase.UI_ELEMENT.equals(s.getParent().getName()))
    				{
    					PickedSpatialInfo i = new PickedSpatialInfo();
    					i.spatial = s;
    					double sizeX = x2-x;
    					double sizeY = y2-y;
    					double ratioX = (hitX-x)/sizeX;
    					double ratioY = (hitY-y)/sizeY;
    					i.ratioX = ratioX;
    					i.ratioY = 1f - ratioY; // inverting Y axis
    					i.absSizeX=sizeX;
    					i.absSizeY=sizeY;
    					list.add(i);
    					//System.out.println("PICKED: "+s.getName());
    				}
	    		}
	    		
	    		if (s instanceof Node)
	    		{
	    			if (loopDetection.contains(s))
	    			{
	    				logger.severe("######### LOOP IN UI-SCENEGRAPH!! "+s);	
	    			} else
	    			{
	    				loopDetection.add(s);
	    				pickUI(list, loopDetection, (Node)s, hitX, hitY);
	    			}
	    		}
	    	}
	    }	
	}

	public void setRootNode(Node rootNode) {
		this.rootNode = rootNode;
	}
	public void setSecondaryFocusNode(Node node) {
		this.secondaryFocusNode = node;
	}
}