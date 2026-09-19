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

package org.jcrpg.threed.engine.tool;

import org.jcrpg.threed.input.JClassicRPGClassicControl;

import com.ardor3d.math.Vector3;
import com.ardor3d.renderer.Camera;

public class CameraProgram
{
	public Camera camera;
	public Vector3 startPosition;
	public Vector3 endPosition;
	public Vector3 originalDirection;
	public Vector3 finalDirection;
	public Vector3 diffVector;
	public Vector3 dirDiffVector;
	public Vector3 currDiffVector;
	public Vector3 currDirDiffVector;
	
	public float runTime;
	
	float currentTime;
	
	public CameraProgram(Camera camera, Vector3 startPosition, Vector3 endPosition, Vector3 originalDirection, Vector3 finalDirection, float runTime)
	{
		this.camera = camera;
		this.startPosition = startPosition;
		this.endPosition = endPosition;
		this.originalDirection = originalDirection;
		this.finalDirection = finalDirection;
		this.runTime = runTime;
		diffVector = endPosition.subtract(startPosition,null);
		dirDiffVector = finalDirection.subtract(originalDirection,null);
		currDiffVector = new Vector3();
		currDirDiffVector = new Vector3();
	}
	public void stop()
	{ 
		camera.setLocation(endPosition);
		JClassicRPGClassicControl.setCameraDirection(camera, finalDirection.getX(), finalDirection.getY(), finalDirection.getZ());
	}
	public void start()
	{
		currentTime = 0;
	}
	/**
	 * returns true if finished.
	 * @param timePerFrame
	 * @return
	 */
	public boolean update(double timePerFrame)
	{
		currentTime+=timePerFrame;
		float percent = currentTime/runTime;
		if (percent>1.0f) percent = 1.0f;
		
		diffVector.multiply(percent,currDiffVector);
		dirDiffVector.multiply(percent,currDirDiffVector);
		
		currDiffVector.addLocal(startPosition);
		currDirDiffVector.addLocal(originalDirection);
		
		camera.setLocation(currDiffVector);
		
		JClassicRPGClassicControl.setCameraDirection(camera, currDirDiffVector.getX(), currDirDiffVector.getY(), currDirDiffVector.getZ());
		
		return percent == 1.0f;
	}
	
}
