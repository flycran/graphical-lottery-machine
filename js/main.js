window.addEventListener('DOMContentLoaded', function () {
   /** @type {HTMLCanvasElement} */
   let cvs = f('#cvs')
   cvs.width = 480
   cvs.height = 320
   let ctx = cvs.getContext('2d')
   let text = f('#text')
   let yg = f('#yg')
   let setUpIcon = f('#setUp-icon')
   let setDownIcon = f('#setDown-icon')
   let setUp = f('#setUp')
   let setData = f('#setData')
   let setDateInput = setData.f('input')
   let setDataButton = setData.f('button')
   setUpIcon.onclick = function () {
      setUp.style.visibility = ''
   }
   setDownIcon.onclick = function () {
      setUp.style.visibility = 'hidden'
   }
   window.luck = {
      list: [],
      s: {
         fx: x => x * luck.maxV / luck.sTime, //速度函数y=xv/t
         Fx: x => x ** 2 * luck.maxV / luck.sTime / 2, //原函数
      },
      p: {
         fx: x => luck.maxV, //速度函数y=v
         Fx: x => x * luck.maxV, //原函数
      },
      e: {
         fx: x => luck.maxV - x ** (1 / luck.eoffN) / luck.eoffC, //速度函数y=a-sqrt(x)/c
         Fx: x => -(luck.eoffN * x ** (1 + 1 / luck.eoffN) - luck.cSpeed * luck.eoffC * x * (luck.eoffN + 1)) / (luck.eoffC * (luck.eoffN + 1)), //原函数
         ft: x => (luck.eoffC * luck.cSpeed) ** luck.eoffN,
      },
      c: {
         fx: x => luck.cV,
         Fx: x => x * luck.cV * luck.coffC,
      },
      setDataf(obj) {
         ['maxV', 'eoffN', 'sTime', 'eTime'].forEach((a, i) => {
            luck.setData[a](obj[i])
         })
      },
      indexOf(v) {
         for (let i = 0; i < luck.list.length; i++) {
            if (luck.list[i].v === v) return i
         }
      },
      setData: {
         maxV(n) {
            luck.maxV = n
            luck.eoffC = luck.eTime ** (1 / luck.eoffN) / luck.maxV
         }, //最大速度(px/ms)
         sTime(n) { //加速时间
            luck.sTime = n
         },
         eTime(n) { //减速时间
            luck.eTime = n
            luck.eoffC = luck.eTime ** (1 / luck.eoffN) / luck.maxV
         },
         eoffN(n) { //次方根
            luck.eoffN = n
            luck.eoffC = luck.eTime ** (1 / luck.eoffN) / luck.maxV
         }
      },
      history: {
         list: [],
         add(i) {
            this.list.push({
               i,
               name: luck.list[i].v
            })
         },
      },
      getData() {
         return {
            maxV: this.maxV,
            sTime: this.sTime,
            eTime: this.eTime,
            eoffC: this.eoffC,
            eoffN: this.eoffN,
            maxT: this.e.ft(),
            maxS: this.e.Fx(this.e.ft())
         }
      },
      maxTop: 0, //最大绝对位移
      maxV: 0, //最大速度
      cV: 0.015, //纠正速度
      sTime: 0, //加速时间
      eTime: 0, //减速时间
      eoffC: 0, //减速系数C
      eoffN: 1, //减速次方根N
      coffC: 0, //纠正系数C
      top: 0, //位移(px)
      time: 0, //时间(ms)
      speed: 0, //速度
      cTop: 0, //缓存位移
      cTime: 0, //缓存时间
      cSpeed: 0, //缓存速度
      timeId: null, //帧渲染算法的计时器对象
      frameTime: 5, //每帧的间隔
      font: '1.6rem Arial', //字体属性
      state: '静止', //摇奖状态
      ele: {
         cvs,
         ctx,
         setUpIcon,
         setDownIcon,
      },
      setTop(v) { //自定义top
         this.top = v
         this.draw()
         return v
      },
      setIndex(v) { //自定义当前选项的index
         this.setTop = (v - 5) * 30
         return v
      },
      setName(v) { //自定义当前选项的name
         this.list.forEach((a, i) => {
            if (a.v === v) {
               this.setIndex = i
               return v
            }
         })
      },
      round: (n, l) => Math.round(n * 10 ** l) / 10 ** l, //精度
      randomList() { //随机打乱list数组
         this.list = this.list.sort((a, b) => Math.random() - 0.5)
         this.list.forEach((a, i) => {
            a.i = i
            a.top = (i + 1) * 30 - 30 / 2
         })
         this.draw()
      },
      frameRate(v) { //设置帧率
         if (v) {
            this.frameTime = 1000 / v
         } else {
            return 1000 / this.frameTime
         }
      },
      fPre: {
         index: undefined,
         change(eTime) {
            if (this.index !== undefined) {
               let preIndex = ((Math.round((luck.cTop + luck.e.Fx(eTime)) % luck.maxTop / 30)) + 5) % luck.list.length
               luck.cTop += (this.index - preIndex) * 30
            }
         },
         f() {
            this.index = undefined
         }
      },
      pre(eTime) {
         let top = this.cTop + this.e.Fx(eTime)
         let ts = Math.round(top % this.maxTop / 30), preTop = ts * 30 + (top - top % this.maxTop)
         this.preInf = {
            index: Math.round(this.top % this.maxTop / 30),
            preIndex: (ts + 5) % this.list.length,
            preTop,
            nachTop: preTop - this.top
         }
         return this.preInf
      },
      sCache() { //同步缓存
         this.cTop = this.top
         this.cTime = this.time
         this.cSpeed = this.speed
      },
      reckonTop(fx) { //计算位移
         this.time += this.frameTime //增加时间
         let t = this.time - this.cTime
         this.speed = this.round(fx.fx(t), 5)
         this.top = this.round(fx.Fx(t) + this.cTop, 2)  //计算位移
         this.draw() //绘制
      },
      start() { //加速
         this.state = '加速'
         this.sCache()
         this.timeId = meterTime(() => {
            this.reckonTop(this.s)
            if (this.time - this.cTime >= this.sTime) {
               this.timeId()
               this.proces()
            }
         }, this.frameTime)
      },
      proces() {//匀速
         this.state = '匀速'
         this.sCache()
         this.timeId = meterTime(() => {
            this.reckonTop(this.p)
         }, this.frameTime)
      },
      end() { //减速
         this.timeId()
         this.state = '减速'
         this.sCache()
         let maxT = this.e.ft()
         if (this.speed >= 1) {
            this.fPre.change(maxT)
         }
         this.pre(maxT)
         this.timeId = meterTime(() => {
            this.reckonTop(this.e) //计算速度和位移
            if (this.time - this.cTime >= maxT) {
               this.timeId() //停止计算帧
               this.correct() //执行纠正算法
            }
         }, this.frameTime)
      },
      correct() { //纠正
         this.sCache()
         this.state = '纠正'
         let tc = this.top % this.maxTop / 30, ts = Math.round(tc)
         if (tc < ts) {
            this.coffC = 1
         } else {
            this.coffC = -1
         }
         this.history.add((ts + 5) % this.list.length)
         let time = Math.abs((this.preInf.preTop - this.top) / this.cV)
         this.timeId = meterTime(() => {
            this.reckonTop(this.c)
            if (this.time - this.cTime >= time) {
               this.top = this.preInf.preTop
               this.speed = 0
               this.draw()
               this.timeId()
               this.state = '静止'
               yg.innerHTML = '开始'
            }
         }, this.frameTime)
      },
      nearest() { //获取最近的项目
         let absTop = this.top % this.maxTop //绝对垂直距离
         let nea, //最近的项目
            neaTop = this.maxTop //最近的项目相对绝对垂直距离的距离
         this.list.forEach((a, i) => {
            if (Math.abs(absTop - a.top) < neaTop) {
               neaTop = Math.abs(absTop - a.top)
               nea = a
            }
         });
         return nea
      },
      draw() {
         cvs.width = cvs.width
         let top = this.top,
            list = this.list
         let nea = this.nearest() //获取最近的项目
         let i = nea.i
         let x //绘制的项目与画布顶部的距离
         let ii //实际绘制的项目在list的索引
         let e = 0  //绘制的项目与实际项目组的因数
         while (true) {
            if (x > 480) { //绘制超出画布范围时退出
               break
            }
            ii = i - this.list.length * e //计算实际绘制的项目在list的索引
            if (ii >= this.list.length) {
               e++
               ii = i - this.list.length * e
            }  //如果实际绘制的项目索引超过项目数量则加大因数e
            x = this.list[ii].top - this.top + this.maxTop * e - 2 //偏移
            ctx.font = this.font
            ctx.textAlign = 'center' //水平居中
            ctx.textBaseline = 'middle' //垂直居中
            ctx.fillText(list[ii].v, 240, x)
            i++
         }
      },
      saveSet() {
         let obj = [
            luck.maxV,
            luck.eoffN,
            luck.sTime,
            luck.eTime,
         ]
         // localStorage.setItem('luck.setData', JSON.stringify(obj))
      }
   }
   luck.frameRate(60)
   { //调用本地设置
      let obj = localStorage.getItem('luck.setData')
      if (obj === '[object Object]' || !obj) {
         obj = [2, 4, 1000, 3000]
      } else {
         obj = JSON.parse(obj)
      }
      luck.setDataf(obj)
   }
   text.addEventListener('keydown', function (e) {
      if (e.code === 'Enter') {
         this.blur()
      }
   })
   text.onchange = function () {
      v = this.value
      localStorage.setItem('luck-list', v)
      v = v.split('')
      let br = true
      v = v.filter(a => {
         if (a === ' ') {
            if (br) {
               br = false
               return true
            }
         } else {
            br = true
            return true
         }
      });
      if (v) {
         v = v.join('').replace(/ /g, '，').split('，')
         luck.list = []
         v.forEach((a, i) => {
            luck.list.push(
               {
                  v: a,
                  i,
                  top: (i + 1) * 30 - 30 / 2
               }
            )
         })
         luck.maxTop = v.length * 30
         luck.draw()
      }
   }
   { //调用本地项目列表
      let list = localStorage.getItem('luck-list')
      if (list) {
         text.value = list
         text.onchange()
      }
   }
   yg.onclick = function () {
      setUp.style.visibility = 'hidden'
      if (luck.state === '静止') {
         this.innerHTML = '停止'
         luck.start()
      } else if (luck.state === '匀速' || luck.state === '加速') {
         luck.end()
      }
   }
   { //调用预言模块
      let fPre = localStorage.getItem('luck.fPre')
      fPre && eval(fPre)
      localStorage.setItem('luck.fPre', null)
   }
   setDateInput[0].onchange = function () {
      luck.setData.maxV(+ this.value)
      luck.saveSet()
   }
   setDateInput[1].onchange = function () {
      luck.setData.sTime(+ this.value)
      luck.saveSet()
   }
   setDateInput[2].onchange = function () {
      luck.setData.eTime(+ this.value)
      luck.saveSet()
   }
   setDateInput[3].onchange = function () {
      luck.setData.eoffN(+ this.value)
      luck.saveSet()
   }
   setDateInput[0].value = luck.maxV
   setDateInput[1].value = luck.sTime
   setDateInput[2].value = luck.eTime
   setDateInput[3].value = luck.eoffN
   setDataButton.onclick = function () {
      luck.randomList()
   }
})

