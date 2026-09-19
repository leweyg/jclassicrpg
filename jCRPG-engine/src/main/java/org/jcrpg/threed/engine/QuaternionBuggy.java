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

import com.ardor3d.math.FastMath;
import com.ardor3d.math.Quaternion;


public class QuaternionBuggy extends com.ardor3d.math.Quaternion {
		@Override
	    public Quaternion fromEulerAngles(double xAngle, double yAngle, double zAngle) {
			double angle;
			double sr, sp, sy, cr, cp, cy;
	        angle = zAngle * 0.5f;
	        sy = FastMath.sin(angle);
	        cy = FastMath.cos(angle);
	        angle = yAngle * 0.5f;
	        sp = FastMath.sin(angle);
	        cp = FastMath.cos(angle);
	        angle = xAngle * 0.5f;
	        sr = FastMath.sin(angle);
	        cr = FastMath.cos(angle);

	        double crcp = cr * cp;
	        double srsp = sr * sp;

	        _x = (sr * cp * cy - cr * sp * sy);
	        _y = (cr * sp * cy + sr * cp * sy);
	        _z = (crcp * sy - srsp * cy);
	        _w = (crcp * cy + srsp * sy);
	        return this;
	    }

}
