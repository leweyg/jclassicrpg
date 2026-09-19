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

public class MaleDrunk1 extends AudioDescription {

	public MaleDrunk1()
	{
		formattedName = "Drunk";
		String base = "humanoid/male_drunk/";
		ATTACK = new String[]{base+"attack-short-1",base+"attack-short-2",base+"attack-short-3"};
		PAIN = new String[]{base+"pain-1",base+"pain-2",base+"pain-3"};
		JOY = new String[]{base+"joy-1",base+"joy-2",base+"joy-3"};
		DEATH = new String[]{base+"death-1",base+"death-2",base+"death-3"};
		ENCOUNTER = new String[]{base+"greetings-1",base+"greetings-2",base+"greetings-3",};
		DANGER = new String[]{base+"danger-1",base+"danger-2",base+"danger-3",};
		LEVELING = new String[] {base+"levelup-1",base+"levelup-2",base+"levelup-3"};
		TIRED = new String[] {base+"tired-1",base+"tired-2",base+"tired-3",};
		BRUISED = new String[] {base+"needhealing-1",base+"needhealing-2",base+"needhealing-3",};
		BRUISED_HEALTH = new String[] {base+"needhealing-1",base+"needhealing-2",base+"needhealing-3",};
		BRUISED_MANA = new String[] {base+"needhealing-1",base+"needhealing-2",base+"needhealing-3",};
		BRUISED_MORALE= new String[] {base+"low-moral-1",base+"low-moral-2",base+"low-moral-3",};
		BRUISED_SANITY = new String[] {base+"crazy-1",base+"crazy-2",base+"crazy-3",};
		BRUISED_STAMINA = new String[] {base+"tired-1",base+"tired-2",base+"tired-3",};
		pitchModifier = 1.0f;
		
	}
	
}
