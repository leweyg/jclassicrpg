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


import java.io.IOException;

import org.jcrpg.apps.Jcrpg;
import org.jcrpg.threed.J3DCore;
import org.jcrpg.ui.UIImageCache;
import org.jcrpg.ui.window.InputWindow;
import org.jcrpg.ui.window.element.input.InputBase;
import org.jcrpg.world.ai.EntityMemberInstance;
import org.jcrpg.world.ai.body.BodyBase;
import org.jcrpg.world.ai.body.BodyPart;
import org.jcrpg.world.object.Armor;
import org.jcrpg.world.object.Equippable;
import org.jcrpg.world.object.ObjInstance;

import com.ardor3d.math.ColorRGBA;
import com.ardor3d.scenegraph.Node;
import com.ardor3d.scenegraph.shape.Quad;
import com.ardor3d.util.export.InputCapsule;
import com.ardor3d.util.export.OutputCapsule;

public class InventoryBody extends InputBase {

	public float textProportion = 400f;

	public InventoryBody(String id, InputWindow w, Node parentNode,
			float centerX, float centerY, float sizeX, float sizeY,float textProportion) {
		super(id, w, parentNode, centerX, centerY, sizeX, sizeY);
		this.textProportion = textProportion;
	}
	
	Quad currentPic = null;
	
	
	public void updateToEntityMemberInstance(EntityMemberInstance instance)
	{
		baseNode.detachAllChildren();
		//if (J3DCore.LOGGING()) Jcrpg.LOGGER.finest("instance.description.bodyType "+instance.description.getName()+" "+instance.description.bodyType);
		BodyBase bodyBase = BodyBase.bodyBaseInstances.get(instance.description.bodyType);
		String image = "/inventory/"+bodyBase.getBodyImage()+".png";
		try {

			if (currentPic!=null) currentPic.removeFromParent();
			if (J3DCore.LOGGING()) Jcrpg.LOGGER.finest("InventoryBody updateTo --- PIC: "+image );
			currentPic = UIImageCache.getImage(image, true, 130f);
			currentPic.setTranslation(dCenterX, dCenterY,0);
			currentPic.setScale(w.core.getDisplay().getWidth()/textProportion);
			baseNode.attachChildAt(currentPic,0);
		} catch (Exception ex)
		{
			ex.printStackTrace();
		}
		for (BodyPart part:bodyBase.bodyParts)
		{
			
			float[] ratio = part.getPlacingRatioXY();
			float fullSizeX = w.core.getDisplay().getWidth()/5.5f;
			float fullSizeY = w.core.getDisplay().getHeight()/4f;
			
			String txt = "0/0";
			for (ObjInstance oI:instance.inventory.getEquipped())
			{
				if (J3DCore.LOGGING()) Jcrpg.LOGGER.finest("- EQPD: "+oI.description.getName());
				if (oI.description instanceof Equippable)
				{
					if (J3DCore.LOGGING()) Jcrpg.LOGGER.finest("- EQPD: "+((Equippable)oI.description).getEquippableBodyPart());
					if (((Equippable)oI.description).getEquippableBodyPart() == part.getClass())
					{
						if (oI.description instanceof Armor)
						{
							int defVal = ((Armor)oI.description).getDefenseValue();
							int hpDecVal = ((Armor)oI.description).getHitPointImpactDecrease();
							txt = defVal+"/"+hpDecVal;
						}
					}
				}
			}
			com.ardor3d.ui.text.BasicText textText = null;
			if (J3DCore.NATIVE_FONT_RENDER)
			{
				float scale = w.core.getDisplay().getWidth()/textProportion/TEXT_PROP;
				if (textText==null)
				{
					textText = createText(txt);
					textText.setScale(scale);
				}
				textText.setTranslation(dCenterX - fullSizeX/2f + fullSizeX*ratio[0], dCenterY - fullSizeY/2f +fullSizeY*ratio[1], 0);
				//deactiveNode.attachChildAt(textText);
				textText.setTextColor(new ColorRGBA(0.8f,0.8f,0.1f,1f));
				baseNode.attachChildAt(textText,0);
			} 
		}
	}

	@Override
	public void reset() {
		// TODO Auto-generated method stub

	}

	@Override
	public Node getDeactivatedNode() {
		// TODO Auto-generated method stub
		return null;
	}

	public void read(InputCapsule capsule) throws IOException {
		// TODO Auto-generated method stub
		
	}

	public void write(OutputCapsule capsule) throws IOException {
		// TODO Auto-generated method stub
		
	}

}
