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
import com.ardor3d.scenegraph.Node;

public class ZoomingNode extends Node
{
	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;

	private boolean zooming = false;
	
	private float zoomTo = 0.5f;
	
	private Vector3 oldScale = new Vector3(1f,1f,1f);
	private float currentTimeSpent = 0;
	private float fullTime = 1;
	
	public ZoomingNode() {
		super();
	}

	public ZoomingNode(String name) {
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
				setScale(oldScale);
			} else
			{
				float ratio = currentTimeSpent/fullTime;
				if (ratio<=0.5f)
				{
				} else
				{
					ratio = 1f-ratio; 
				}
				ratio*=2f;
				setScale(oldScale.multiply(1f+(ratio*zoomTo),null));
			}
		}
		super.updateGeometricState(time, initiator);
	}
	
	public void startZoomCycle()
	{
		if (zooming)
		{
			setScale(oldScale);
			currentTimeSpent = 0;
			getParent().updateGeometricState(0);

		}
		if (!zooming)
		{
			oldScale = new Vector3(getScale());
		}
		zooming = true;		
	}
}
