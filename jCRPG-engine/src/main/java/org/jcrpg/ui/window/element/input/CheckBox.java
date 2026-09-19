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
import java.util.logging.Level;

import org.jcrpg.apps.Jcrpg;
import org.jcrpg.threed.J3DCore;
import org.jcrpg.ui.Window;
import org.jcrpg.ui.mouse.UiMouseEvent;
import org.jcrpg.ui.window.InputWindow;

import com.ardor3d.math.ColorRGBA;
import com.ardor3d.scenegraph.Node;
import com.ardor3d.scenegraph.shape.Quad;
import com.ardor3d.util.export.InputCapsule;
import com.ardor3d.util.export.OutputCapsule;

/**
 * CheckBox Input 
 *
 * @author goq669
 */
public class CheckBox extends InputBase {

    public static final String defaultImage = "/checkBoxBase.png";
    public static final String selectedImage = "/checkBoxSelected.png";
    private String bgImage = defaultImage; 
    private boolean checked = false;

    Node activeNode = null;
    Node deactiveNode = null;

    public CheckBox(String id, InputWindow w, Node parentNode, boolean checked) {
        super(id, w, parentNode);
        setChecked(checked);
    }

    public CheckBox(String id, InputWindow w, Node parentNode, float centerX, float centerY, float sizeX,
            float sizeY, boolean checked) {
        super(id, w, parentNode, centerX, centerY, sizeX, sizeY);
        setChecked(checked);
        deactivate();
        w.base.addEventHandler("lookLeft", w);
        w.base.addEventHandler("lookRight", w);
        w.base.addEventHandler("enter", w);
        w.base.addEventHandler("space", w);
        //parentNode.updateRenderState();
    }
	

    @Override
    public void init(float centerX, float centerY, float sizeX, float sizeY) {
        super.init(centerX, centerY, sizeX, sizeY);
        if (baseNode!=null) {
            deactivate(); 
            w.base.addEventHandler("lookLeft", w);
            w.base.addEventHandler("lookRight", w);
            w.base.addEventHandler("enter", w);
            w.base.addEventHandler("space", w);
            //parentNode.updateRenderState();
        }
    }

    @Override
    public void activate() {
        baseNode.detachAllChildren();
        activeNode = new Node(""+id);
        try {
            Quad w1 = Window.loadImageToQuad(new File(bgImage), dSizeX, dSizeY, dCenterX, dCenterY);
            w1.setSolidColor(ColorRGBA.WHITE);
            activeNode.attachChildAt(w1,0);
        } catch (Exception ex) {
            if (J3DCore.LOGGING()) { Jcrpg.LOGGER.log(Level.SEVERE, ex.getMessage(), ex); }
            ex.printStackTrace();
        }
        baseNode.attachChildAt(activeNode,0);
		/*activeNode.setModelBound(new BoundingBox());
		baseNode.updateRenderState();
		baseNode.updateModelBound();*/
        super.activate();
    }

    @Override
    public void deactivate() {
        baseNode.detachAllChildren();
        deactiveNode = new Node(""+id);
        try {
            Quad w1 = Window.loadImageToQuad(new File(bgImage), dSizeX, dSizeY, dCenterX, dCenterY);
            w1.setSolidColor(ColorRGBA.GRAY);
            deactiveNode.attachChildAt(w1,0);
        } catch (Exception ex) {
            if (J3DCore.LOGGING()) { Jcrpg.LOGGER.log(Level.SEVERE, ex.getMessage(), ex); }
            ex.printStackTrace();
        }
        baseNode.attachChildAt(deactiveNode,0);
		//deactiveNode.setModelBound(new BoundingBox());
		//baseNode.updateRenderState();
		// TODO ardor3d baseNode.updateModelBound();
        super.deactivate();
    }

    @Override
    public boolean handleKey(String key) {
        if (key.equals("enter") || key.equals("space") || 
            key.equals("lookLeft") || key.equals("lookRight") ) 
        {
            setChecked(!isChecked());
            w.core.audioServer.play(SOUND_INPUTSELECTED);
            w.inputUsed(this, key);
            this.setUpdated(true);
            activate();
            return true;
        }
        if (J3DCore.LOGGING()) Jcrpg.LOGGER.finest("--- "+id+" "+key);
        return false;
    }

    @Override
    public void reset() {
    }

    public boolean isChecked() {
        return checked;
    }

    public void setChecked(boolean checked) {
        this.checked = checked;
        bgImage = (checked ? selectedImage : defaultImage); 
    }

	@Override
	public boolean handleMouse(UiMouseEvent mouseEvent)
	{
		super.handleMouse(mouseEvent);
		if (w!=null)
		if(mouseEvent.isButtonPressed(UiMouseEvent.BUTTON_LEFT))
        {
    		return handleKey("enter");
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
