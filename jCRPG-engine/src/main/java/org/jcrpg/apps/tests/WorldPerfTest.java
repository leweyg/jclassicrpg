package org.jcrpg.apps.tests;

import java.io.File;
import java.io.FileInputStream;

import org.jcrpg.apps.Jcrpg;
import org.jcrpg.world.Engine;
import org.jcrpg.world.ai.Ecology;
import org.jcrpg.world.ai.EcologyGenerator;
import org.jcrpg.world.ai.humanoid.HumanoidEntityDescription;
import org.jcrpg.world.generator.WorldGenerator;
import org.jcrpg.world.generator.WorldParams;
import org.jcrpg.world.generator.WorldParamsConfigLoader;
import org.jcrpg.world.generator.program.DefaultClassFactory;
import org.jcrpg.world.generator.program.DefaultGenProgram;
import org.jcrpg.world.place.World;
import org.jcrpg.world.place.orbiter.WorldOrbiterHandler;
import org.jcrpg.world.place.orbiter.moon.SimpleMoon;
import org.jcrpg.world.place.orbiter.sun.SimpleSun;
import org.jcrpg.world.time.Time;

public class WorldPerfTest {

	
	public World getWorld() throws Exception
	{
		Engine engine = new Engine();
		Time wmt = new Time();
		wmt.setHour(12);
		engine.setWorldMeanTime(wmt);
		engine.setNumberOfTurn(0);
		
		WorldParams params = (new WorldParamsConfigLoader()).getWorldParams(new File("../scenario/jclassicrpg/worldparams.xml"));
		WorldGenerator gen = new WorldGenerator();
		World world = gen.generateWorld(new DefaultGenProgram(new DefaultClassFactory(),gen,params));
		world.engine = engine;

		WorldOrbiterHandler woh = new WorldOrbiterHandler();
		woh.addOrbiter("sun", new SimpleSun("SUN"));
		woh.addOrbiter("moon", new SimpleMoon("moon"));

		world.setOrbiterHandler(woh);

		HumanoidEntityDescription.bugger.clear();
		EcologyGenerator eGen = new EcologyGenerator(new FileInputStream(new File("../scenario/jclassicrpg/ecology.xml")));
		Ecology ecology = eGen.generateEcology(world);
		
		world.economyContainer.roadNetwork.updateRoads(world.economyContainer.treeLocator);	
		return world;
	
	}
	
	public void testWorldLoadSpeed() throws Exception
	{
		World w = getWorld();
		long time = 0;
		time = System.currentTimeMillis();
		int count = 0;
		while (true)
		{
			w.getHeight((int)(Math.random()*w.realSizeX), (int)(Math.random()*w.realSizeZ));
			//w.getCube(-1, (int)(Math.random()*w.realSizeX), (int)(Math.random()*w.realSizeZ),40,false);
			count++;
			if (count>10000)
			{
				count = 0;
				System.out.println(System.currentTimeMillis()-time);
				time = System.currentTimeMillis();
			}
		}
	}
	
	public static void main(String args[]) throws Exception
	{
		Jcrpg.TOOL_SESSION = true;
		new WorldPerfTest().testWorldLoadSpeed();
	}
}
