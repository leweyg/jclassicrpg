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

package org.jcrpg.threed.engine;

import java.util.ArrayList;

import com.ardor3d.math.Vector3;

public class VectorPool {

	private static final ObjectPool<Vector3> VEC_POOL = ObjectPool.create(Vector3.class, 30);

	static ArrayList<Vector3> vector3List = new ArrayList<Vector3>();
	
	public static Vector3 getVector3f()
	{
		return VEC_POOL.fetch();

	}
	public static Vector3 getVector3(double x, double y, double z)
	{
		Vector3 r = VEC_POOL.fetch();
		r.set(x,y,z);
		return r;
	}
	public static void releaseVector3(Vector3 vec)
	{
		VEC_POOL.release(vec);
	}
	
}
