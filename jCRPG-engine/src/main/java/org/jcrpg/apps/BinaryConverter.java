package org.jcrpg.apps;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;

import org.jcrpg.threed.J3DCore;

import com.ardor3d.extension.model.obj.ObjGeometryStore;
import com.ardor3d.extension.model.obj.ObjImporter;
import com.ardor3d.scenegraph.Spatial;
import com.ardor3d.util.export.binary.BinaryExporter;
import com.ardor3d.util.resource.MultiFormatResourceLocator;
import com.ardor3d.util.resource.ResourceLocatorTool;
import com.ardor3d.util.resource.URLResourceSource;

public class BinaryConverter {

	
	int len = 0;
	String TEXDIR = "high";
	String cacheDir = "./cache/"+TEXDIR+"/";
	String modelsDir = "../media/";
	
	
	public void recoursiveLookup(File parent, String extension) throws Exception
	{
	
		File[] files = parent.listFiles();
		for (File f:files)
		{
			if (f.isDirectory())
			{
				recoursiveLookup(f, extension);
			}
			else
			if (f.getAbsolutePath().endsWith(extension))
			{
				convert(f);
			}
		}
	}
	
	public void convert(File f) throws Exception
	{
		System.out.println("CONVERTING: "+f.getAbsolutePath());
		ObjImporter objtojme = new ObjImporter();

		ObjGeometryStore store = null;
		store = objtojme.load(new URLResourceSource(f.toURI().toURL()));

		Spatial spatial = store.getScenegraph();//(Spatial)binaryImporter.load(in);
		
        final ByteArrayOutputStream bos = new ByteArrayOutputStream();
        
        FileOutputStream fos = new FileOutputStream(cacheDir+(f.getAbsolutePath().substring(len).replace("/", "_")));
        try {
            BinaryExporter.getInstance().save(spatial, fos);
        } catch (final IOException e) {
        }

	}
	

	public void run() throws Exception
	{
	    try {
    		MultiFormatResourceLocator loc1 = new MultiFormatResourceLocator(new File("../media/textures/models/"+TEXDIR).toURI(), ".DDS", ".dds", ".png",".jpg");
    		MultiFormatResourceLocator loc2 = new MultiFormatResourceLocator(new File("../media/textures/orbiters/").toURI(), ".dds", ".png",".jpg");
    		MultiFormatResourceLocator loc3 = new MultiFormatResourceLocator(new File("../media/textures/flare/").toURI(), ".dds", ".png",".jpg");
    		MultiFormatResourceLocator loc4 = new MultiFormatResourceLocator(new File("../media/textures/models/common/").toURI(), ".dds", ".png",".jpg");
    		if (false)
    		{
        		 loc1 = new MultiFormatResourceLocator(new File("../media/textures/models/low_png/").toURI(),  ".png",".jpg");
        		 loc2 = new MultiFormatResourceLocator(new File("../media/textures/orbiters/").toURI(),  ".png",".jpg");
        		 loc3 = new MultiFormatResourceLocator(new File("../media/textures/flare/").toURI(),  ".png",".jpg");
        		 loc4 = new MultiFormatResourceLocator(new File("../media/textures/models/common/").toURI(),  ".png",".jpg");
    		}
	    	
	        ResourceLocatorTool.addResourceLocator(ResourceLocatorTool.TYPE_TEXTURE, loc1);
	        ResourceLocatorTool.addResourceLocator(ResourceLocatorTool.TYPE_TEXTURE, loc2);
	        ResourceLocatorTool.addResourceLocator(ResourceLocatorTool.TYPE_TEXTURE, loc3);
	        ResourceLocatorTool.addResourceLocator(ResourceLocatorTool.TYPE_TEXTURE, loc4);
	    } catch (Exception e) {
	        e.printStackTrace();
	    }
	    
		File root = new File(modelsDir);
		len = root.getAbsolutePath().length()+1;
		recoursiveLookup(root, ".obj");
	}
	
	public static void main(String args[]) throws Exception
	{
		new BinaryConverter().run();
	}
	
}
