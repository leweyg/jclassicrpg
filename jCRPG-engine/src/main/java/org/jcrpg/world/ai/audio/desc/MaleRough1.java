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

public class MaleRough1 extends AudioDescription {

	public MaleRough1()
	{
		formattedName = "Rough1";
		String base = "humanoid/male_rough1/";
		ATTACK = new String[]{base+"attack1",base+"attack2",base+"attack3"};
		PAIN = new String[]{base+"pain1",base+"pain2",base+"pain3"};
		JOY = new String[]{base+"joy1",base+"joy2",base+"joy3"};
		DEATH = new String[]{base+"death1",base+"death2",base+"death3"};
		ENCOUNTER = new String[]{base+"greeting1",base+"greeting2",base+"greeting3",};
		DANGER = new String[]{base+"danger1",base+"danger2",base+"danger3",};
		LEVELING = new String[] {base+"leveling1",base+"leveling2",base+"leveling3"};
		TIRED = new String[] {base+"tired1",base+"tired2",base+"tired3",};
		BRUISED = new String[] {base+"needheal1",base+"needheal2",base+"needheal3",};
		BRUISED_HEALTH = new String[] {base+"needheal1",base+"needheal2",base+"needheal3",};
		BRUISED_MANA = new String[] {base+"needheal1",base+"needheal2",base+"needheal3",};
		BRUISED_MORALE= new String[] {base+"lowmorale1",base+"lowmorale2",base+"lowmorale3",};
		BRUISED_SANITY = new String[] {base+"crazy1",base+"crazy2",base+"crazy3",};
		BRUISED_STAMINA = new String[] {base+"tired1",base+"tired2",base+"tired3",};
		pitchModifier = 1.1f;
		
	}
	
}
