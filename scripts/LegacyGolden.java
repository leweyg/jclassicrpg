import org.jcrpg.util.HashUtil;
import org.jcrpg.world.place.economic.residence.dungeon.MazeTool;
import java.util.Base64;
/** Compile with the unmodified repository HashUtil.java and MazeTool.java. */
public class LegacyGolden {
 public static void main(String[] args) {
  System.out.print("{\"fixtureVersion\":1,\"source\":\"unmodified Java HashUtil and MazeTool\",\"hashes\":[");
  int[][] vectors={{0,0,0},{1,2,3},{160,181,0},{Integer.MAX_VALUE,-1,32},{Integer.MIN_VALUE,Integer.MAX_VALUE,-42},{928,17,58}};
  boolean first=true;
  for(int worldSeed:new int[]{0,1,-1,2147483647})for(int[] v:vectors){HashUtil.WORLD_RANDOM_SEED=worldSeed;if(!first)System.out.print(",");first=false;System.out.print("["+v[0]+","+v[1]+","+v[2]+","+worldSeed+","+HashUtil.mix(v[0],v[1],v[2])+"]");}
  HashUtil.WORLD_RANDOM_SEED=0;System.out.print("],\"mazes\":[");first=true;
  for(int size:new int[]{0,1,2,3,4,5,12,29,64,128})for(int seed:new int[]{0,1,928,2147483647})for(boolean closed:new boolean[]{false,true}){
   byte[][] grid=MazeTool.getLabyrinth(seed,size,size,closed);byte[] flat=new byte[size*size];for(int z=0;z<size;z++)for(int x=0;x<size;x++)flat[x+size*z]=grid[x][z];
   if(!first)System.out.print(",");first=false;System.out.print("{\"seed\":"+seed+",\"width\":"+size+",\"depth\":"+size+",\"allClosed\":"+closed+",\"base64\":\""+Base64.getEncoder().encodeToString(flat)+"\"}");
  }System.out.println("]}");
 }
}
