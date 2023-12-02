import { Context, Schema, h } from 'koishi'
import { resolve } from 'path'
import {} from '@koishijs/plugin-console'
import { userInfo } from 'os'

export const name = 'lyrics'

export interface Config {
  trigger: boolean
}

export const Config: Schema<Config> = Schema.object({
  trigger: Schema.boolean().default(true).description('需要带上指令前缀才能触发接歌词'),
})

export function apply(ctx: Context, config: Config) {

    ctx.command('接歌词 <message:string>', '发送歌词，机器人接下一句歌词').alias('/接歌词').action(
      async (_, message) => {
        var text = "歌词 " + message;
        const data = await ctx.http.post("https://www.sogou.com/tx?query="+text, )
        var match_lyrics = getTextBetweenMarkers(data,'<div class="lyric-box">','</div>')
        if (!match_lyrics?.length) return `未匹配到歌词`
        console.log(match_lyrics)
        var para_lyrics:string[];
        para_lyrics = extractTextBetweenMarkers(match_lyrics,'<p class="fz-mid">','</p>')
        //console.log(para_lyrics)
        return findNextLyric(para_lyrics,"<em><!--red_beg-->"+message+"<!--red_end--></em>")
    }
  )
  ctx.middleware(async (session, next) => {
  //
  console.log("获取到信息"+session.content);
  if(config.trigger==false){
  var text = "歌词 " + excludeString(session.content,'<at id="'+session.selfId+'"/> ');//<at id={userId}/>
  const data = await ctx.http.post("https://www.sogou.com/tx?query="+text, )
  var match_lyrics = getTextBetweenMarkers(data,'<div class="lyric-box">','</div>')
  if (!match_lyrics?.length) return `未匹配到歌词。`
  console.log(match_lyrics)
  var para_lyrics:string[];
  para_lyrics = extractTextBetweenMarkers(match_lyrics,'<p class="fz-mid">','</p>')
  //console.log(para_lyrics)
  return findNextLyric(para_lyrics,"<em><!--red_beg-->"+excludeString(session.content,'<at id="'+session.selfId+'"/> ')+"<!--red_end--></em>")
  }

})
}

export function getTextBetweenMarkers(str: string, marker1: string, marker2: string): string | null {  
  const index1 = str.indexOf(marker1);  
  if (index1 === -1) {  
      return null; // 如果找不到第一个标记，返回 null  
  }  

  const index2 = str.indexOf(marker2, index1 + marker1.length);  
  if (index2 === -1) {  
      return null; // 如果找不到第二个标记，返回 null  
  }  

  return str.slice(index1 + marker1.length, index2); // 返回两个标记之间的子字符串  
}

export function extractTextBetweenMarkers(str: string, marker1: string, marker2: string): string[] {  
  const regex = new RegExp(`${marker1}([\\s\\S]*?)${marker2}`, 'g');  
  const matches = str.match(regex);  
  return matches ? matches.map(match => match.replace(marker1, '').replace(marker2, '')) : [];  
}

export function findNextLyric(lyrics: string[], currentLyric: string): string | null {  
    // 判断当前歌词是否在歌词数组中  
    var index = -1;
    for (let i = 0; i < lyrics.length; i++) {  
        if (lyrics[i].indexOf(currentLyric) !== -1) {  
            index = i; 
            break;  
        }
    }
      if (index === -1) {  
          return null;  
      }  
      // 如果当前歌词是完整的句子，则尝试查找下一句歌词  
      // 如果当前歌词不是完整的句子，则在同一个完整句子中查找下一句歌词  
      const fullLyric = lyrics[index]; 
      const otherLyric = excludeString(fullLyric,currentLyric);  
      if (otherLyric!="") {  
          return otherLyric;  
      }
      else if (lyrics[index + 1]) {  
          return lyrics[index + 1];  
      }
      return null;  
}

export function excludeString(mainStr: string, excludeStr: string): string {  
  return mainStr.replace(new RegExp(excludeStr, 'g'), '');  
}  
