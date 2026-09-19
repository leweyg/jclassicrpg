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
package org.jcrpg.threed.engine.ui;

import com.ardor3d.math.Vector3;
import com.ardor3d.math.type.ReadOnlyVector3;
import com.ardor3d.scenegraph.Node;

/**
 * Zooms the parent in cycle
 * @author pali
 *
 */
public class ZoomingParentNode extends Node
{
	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;

	private boolean zooming = false;
	
	private double zoomTo = 0.7f;
	
	private ReadOnlyVector3 oldScale = new Vector3(1f,1f,1f);
	private float currentTimeSpent = 0;
	private float fullTime = 1.2f;
	
	public ZoomingParentNode() {
		super();
	}

	public ZoomingParentNode(String name) {
		super(name);
	}
	

	@Override
	public void updateGeometricState(double time, boolean initiator) {
		if (zooming)
		{
			currentTimeSpent+=time;
			if (fullTime<currentTimeSpent)
			{
				currentTimeSpent = 0;
				zooming = false;
				getParent().setScale(oldScale);
				getParent().updateGeometricState(0);
				getParent().updateWorldTransform(true);

				removeFromParent();
			} else
			{
				double ratio = currentTimeSpent/fullTime;
				if (ratio<=0.5f)
				{
				} else
				{
					ratio = 1f-ratio; 
				}
				ratio*=2f;
				getParent().setScale(oldScale.multiply(1d+(ratio*zoomTo),null));
			}
		}
	}
	
	public void startZoomCycle()
	{
		if (zooming)
		{
			getParent().setScale(oldScale);
			currentTimeSpent = 0;
			getParent().updateGeometricState(0);
			getParent().updateWorldTransform(true);

		}
		if (!zooming)
		{
			oldScale = new Vector3(getParent().getScale());
		}
		zooming = true;
	}
}
