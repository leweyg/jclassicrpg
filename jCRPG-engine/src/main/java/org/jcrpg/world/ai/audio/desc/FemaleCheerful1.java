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

package org.jcrpg.world.ai.audio.desc;

import org.jcrpg.world.ai.AudioDescription;

public class FemaleCheerful1 extends AudioDescription {

	public FemaleCheerful1()
	{
		formattedName = "Cheerful1";
		String base = "humanoid/female_cheerful1/f_";
		ATTACK = new String[]{base+"attack1_bunches",base+"attack2_bunches",base+"attack3_bunches",};
		PAIN = new String[]{base+"pain1_bunches",base+"pain2_bunches",base+"pain3_bunches",};
		JOY = new String[]{base+"joyheal1_bunches",base+"joyheal2_bunches",base+"joyheal3_bunches",};
		DEATH = new String[]{base+"death1_bunches",base+"death2_bunches",base+"death3_bunches",};
		ENCOUNTER = new String[]{base+"greeting1_bunches",base+"greeting2_bunches",base+"greeting3_bunches",};
		DANGER = new String[]{base+"sensingdanger1_bunches",base+"sensingdanger2_bunches",base+"sensingdanger3_bunches",};
		LEVELING = new String[] {base+"levelup1_bunches",base+"levelup2_bunches",base+"levelup3_bunches",};
		TIRED = new String[] {base+"tired1_bunches",base+"tired2_bunches",base+"tired3_bunches",};
		BRUISED = new String[] {base+"needheal1_bunches",base+"needheal2_bunches",base+"needheal3_bunches",};
		BRUISED_HEALTH = new String[] {base+"needheal1_bunches",base+"needheal2_bunches",base+"needheal3_bunches",};
		BRUISED_MANA = new String[] {base+"needheal1_bunches",base+"needheal2_bunches",base+"needheal3_bunches",};
		BRUISED_MORALE= new String[] {base+"lowmorale1_bunches",base+"lowmorale2_bunches",base+"lowmorale3_bunches",};
		BRUISED_SANITY = new String[] {base+"crazy1_bunches",base+"crazy2_bunches",base+"crazy3_bunches",};
		BRUISED_STAMINA = new String[] {base+"tired1_bunches",base+"tired2_bunches",base+"tired3_bunches",};
		pitchModifier = 1.0f;		
	}
}
