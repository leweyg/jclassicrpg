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

package org.jcrpg.threed;

import java.util.HashMap;

import org.jcrpg.threed.GeoTileLoader.NeighborCubeData;
import org.jcrpg.threed.scene.RenderedCube;
import org.jcrpg.threed.scene.model.Model;
import org.jcrpg.threed.scene.model.SimpleModel;
import org.jcrpg.threed.scene.moving.RenderedMovingUnit;

import com.ardor3d.math.Quaternion;
import com.ardor3d.math.Vector3;

public class NodePlaceholder {

	public Model model;
	public RenderedCube cube;
	public RenderedMovingUnit unit;
	public PooledNode realNode;
	public Object modelGeomBatchInstance;
	public Object trimeshGeomBatchInstance;
	public HashMap<String, Object> multiBatchInstance;
	public boolean farView = false;
	
	public Quaternion localRotation;
	/** helper separate horizontalRotation from RenderedHashRotatedSide, use it with trimeshGeomBatch only: */
	public Quaternion horizontalRotation;
	public Vector3 localScale, localTranslation;
	public Object userData = null;
	/**
	 * For ground generation it's used only - filled by GeometryBatchHelper getKey(.
	 */
	public NeighborCubeData neighborCubeData = null;

	boolean checkedGeneratedGround = false;
	public NeighborCubeData getNeighborCubeData()
	{
		if (checkedGeneratedGround)
		{
			return neighborCubeData;
		}
		if (neighborCubeData==null && model.type==Model.SIMPLEMODEL && ((SimpleModel)model).generatedGroundModel)
		{
			neighborCubeData = GeoTileLoader.getNeighborCubes(this);
			checkedGeneratedGround = true;
		}
		return neighborCubeData;
	}
	
	public Quaternion getLocalRotation() {
		
		return localRotation;
	}
	public Vector3 getLocalScale() {
		
		return localScale;
	}
	public com.ardor3d.math.Vector3 getLocalTranslation() {
		
		return localTranslation;
	}
	
	public Object getUserData() {
		
		return userData;
	}
	
	public void removeUserData() {
		
		 userData = null;
	}
	
	public void setLocalRotation(Quaternion quaternion) {
		
		localRotation = quaternion;
	}
	
	public void setLocalScale(float localScale) {
		
		this.localScale = new Vector3(localScale,localScale,localScale);
	}
	
	public void setLocalScale(Vector3 localScale) {
		
		this.localScale = localScale;
	}
	
	public void setLocalTranslation(float x, float y, float z) {
		localTranslation = new Vector3(x,y,z);
	}
	
	public void setLocalTranslation(Vector3 localTranslation) {
		
		this.localTranslation = localTranslation;
	}
	
	public void setUserData(Object data) {
		
		userData = data;
	}
	
	public void clear()
	{
		cube = null;
		unit = null;
		if (multiBatchInstance!=null) multiBatchInstance.clear();
		modelGeomBatchInstance = null;
		trimeshGeomBatchInstance = null;
		if (neighborCubeData!=null) neighborCubeData.clear();
		neighborCubeData = null;
		realNode = null;
		if (userData!=null) userData = null;
		userData = null;
	}
}
