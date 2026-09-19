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

package org.jcrpg.ui.window.element;

import java.io.File;
import java.io.IOException;

import org.jcrpg.threed.J3DCore;
import org.jcrpg.ui.Window;
import org.jcrpg.ui.window.InputWindow;
import org.jcrpg.ui.window.element.input.InputBase;

import com.ardor3d.math.ColorRGBA;
import com.ardor3d.scenegraph.Node;
import com.ardor3d.scenegraph.shape.Quad;
import com.ardor3d.ui.text.BasicText;
import com.ardor3d.util.export.InputCapsule;
import com.ardor3d.util.export.OutputCapsule;

public class TextLabel extends InputBase {

	public String text;
	
	public static final String defaultImage = "/buttonBase.png";
	public String bgImage = defaultImage; 
	public float textProportion = 400f;
	public boolean useImage = false;
	public boolean centered = false;
	public TextLabel(String id, InputWindow w, Node parentNode, float textProportion, String text, boolean useImage) {
		super(id, w, parentNode);
		this.text = text;
		this.textProportion = textProportion;
		this.useImage = useImage;
		// activates in the init
	}
    public TextLabel(String id, InputWindow w, Node parentNode, float textProportion, String text, boolean useImage, boolean centered) {
        super(id, w, parentNode);
        this.text = text;
        this.textProportion = textProportion;
        this.useImage = useImage;
        this.centered = centered;
        // activates in the init
    }
	public TextLabel(String id, InputWindow w, Node parentNode, float centerX, float centerY, float sizeX,
			float sizeY, float textProportion, String text, boolean useImage) {
		super(id, w, parentNode, centerX, centerY, sizeX, sizeY);
		this.text = text;
		this.textProportion = textProportion;
		this.useImage = useImage;
		this.centered = useImage;
		activate();
	}
	public TextLabel(String id, InputWindow w, Node parentNode, float centerX, float centerY, float sizeX,
			float sizeY, float textProportion, String text, boolean useImage, boolean centered, ColorRGBA normalColor) {
		super(id, w, parentNode, centerX, centerY, sizeX, sizeY);
		this.normalColor = normalColor;
		this.text = text;
		this.textProportion = textProportion;
		this.useImage = useImage;
		this.centered = centered;
		activate();
	}
	
	@Override
	public void init(float centerX, float centerY, float sizeX, float sizeY) {
		super.init(centerX, centerY, sizeX, sizeY);
		if (baseNode!=null) {
			activate();
		}
	}
	
	Node activeNode = null;
	Node deactiveNode = null;

	org.jcrpg.ui.BasicText textText = null;
	
	@Override
	public void activate() {
		baseNode.detachAllChildren();
		//if (activeNode==null ) 
		{
			activeNode = new Node();
			if (useImage)
			try {
				Quad w1 = Window.loadImageToQuad(new File(bgImage), dSizeX, dSizeY, dCenterX, dCenterY);
				w1.setSolidColor(ColorRGBA.WHITE);
				activeNode.attachChildAt(w1,0);
			} catch (Exception ex) 
			{
				ex.printStackTrace();
			}
			if (J3DCore.NATIVE_FONT_RENDER)
			{
				double scale = J3DCore.getInstance().getDisplay().getWidth()/textProportion/TEXT_PROP;
				if (textText==null)
				{
					textText = createText(text);
					textText.setScale(scale);
				}
				textText.setText(text);
				textText.setTranslation(!centered?dOrigoX:textText.getCenterOrigoX(dCenterX,(float)scale), - textText.getHeight2()/2f*scale + dCenterY,0);
				textText.setTextColor(normalColor);
			}
		}
		if (J3DCore.NATIVE_FONT_RENDER)
		{
			textText.removeFromParent();
			activeNode.attachChildAt(textText,0);
		}
		baseNode.attachChildAt(activeNode,0);
		super.activate();
	}

	@Override
	public void deactivate() {
		baseNode.detachAllChildren();
		
		if (deactiveNode==null ) {
			deactiveNode = new Node();
			if (useImage)
			try {
				Quad w1 = Window.loadImageToQuad(new File(bgImage), dSizeX, dSizeY, dCenterX, dCenterY);
				w1.setSolidColor(ColorRGBA.GRAY);
				deactiveNode.attachChildAt(w1,0);
			} catch (Exception ex)
			{
				ex.printStackTrace();
			}
			if (J3DCore.NATIVE_FONT_RENDER)
			{
				double scale = J3DCore.getInstance().getDisplay().getWidth()/textProportion/TEXT_PROP;
				if (textText==null)
				{
					textText = createText(text);
					textText.setScale(scale);
				}
				textText.setText(text);
				textText.setTranslation(!centered?dOrigoX:textText.getCenterOrigoX(dCenterX,(float)scale), - textText.getHeight2()/2f*scale + dCenterY,0);
				deactiveNode.attachChildAt(textText,0);
				textText.setTextColor(deactivatedColor);
			}
		}
		if (J3DCore.NATIVE_FONT_RENDER)
		{
			textText.removeFromParent();
			deactiveNode.attachChildAt(textText,0);
		}
		baseNode.attachChildAt(deactiveNode,0);
		super.deactivate();
	}

	@Override
	public boolean handleKey(String key) {
		if (key.equals("enter"))
		{
			w.inputUsed(this, key);
			return true;
		}
		return false;
	}

	@Override
	public void reset() {
	}
	@Override
	public Node getDeactivatedNode() {
		return null;
	}
	public void read(InputCapsule capsule) throws IOException {
		// TODO Auto-generated method stub
		
	}
	public void write(OutputCapsule capsule) throws IOException {
		// TODO Auto-generated method stub
		
	}

}
