
class Bar {
	constructor(
		public open: number,
		public high: number,
		public low: number,
		public close: number,
		public time: number
	) {}

	draw(
		ctx: CanvasRenderingContext2D,
		x: number,
		width: number,
		openY: number,
		closeY: number,
		highY: number,
		lowY: number
	) {
		const candleColor = this.close > this.open ? "green" : "red"

		ctx.beginPath()
		ctx.moveTo(x + width / 2, highY)
		ctx.lineTo(x + width / 2, lowY)
		ctx.strokeStyle = "black"
		ctx.stroke()
		ctx.fillStyle = candleColor
		ctx.fillRect(x, Math.min(openY, closeY), width, Math.abs(openY - closeY))
	}
}

class Chart {
	private bars: Bar[] = []
	private offsetX: number = 0
	private barWidth: number = 5
	private minBarWidth: number = 2
	private maxBarWidth: number = 20
    private priceStep: number = 50 
	private dateStep: number = 50 
	constructor(private canvas: HTMLCanvasElement) {
		this.init()
	}
	setBars(bars: Bar[]) {
		this.bars = bars
	}
	init() {
		this.canvas.addEventListener("wheel", this.onZoom.bind(this))
        this.canvas.addEventListener("wheel", this.onScroll.bind(this))

	}

	draw() {
		const ctx = this.canvas.getContext("2d")
		if (!ctx) return

		const maxPrice = Math.max(...this.bars.map((bar) => bar.high))
		const minPrice = Math.min(...this.bars.map((bar) => bar.low))
		const priceRange = maxPrice - minPrice

		ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
		this.drawPriceScale(ctx, minPrice, maxPrice)

		this.bars.forEach((bar, index) => {
			const x = index * 10 + this.offsetX
			if (x > 0 && x < this.canvas.width) {
				const openY =
					this.canvas.height -
					((bar.open - minPrice) / priceRange) * this.canvas.height
				const closeY =
					this.canvas.height -
					((bar.close - minPrice) / priceRange) * this.canvas.height
				const highY =
					this.canvas.height -
					((bar.high - minPrice) / priceRange) * this.canvas.height
				const lowY =
					this.canvas.height -
					((bar.low - minPrice) / priceRange) * this.canvas.height

				bar.draw(ctx, x, 5, openY, closeY, highY, lowY)
			}
		})
        this.drawDateScale(ctx)

	}
    drawPriceScale(ctx: CanvasRenderingContext2D, minPrice: number, maxPrice: number) {
		const priceRange = maxPrice - minPrice
		const steps = 10
		const stepSize = priceRange / steps

		ctx.fillStyle = "black"
		ctx.font = "12px Arial"

		for (let i = 0; i <= steps; i++) {
			const price = minPrice + stepSize * i
			const y = this.canvas.height - (i / steps) * this.canvas.height

			ctx.fillText(price.toFixed(2), 5, y - 5) 
			ctx.beginPath()
			ctx.moveTo(0, y)
			ctx.lineTo(this.canvas.width, y)
			ctx.strokeStyle = "#E0E0E0" 
			ctx.stroke()
		}
	}

    drawDateScale(ctx: CanvasRenderingContext2D) {
		const dateFormatter = new Intl.DateTimeFormat("en-GB", {
			year: "2-digit",
			month: "2-digit",
			day: "2-digit",
		})

		ctx.fillStyle = "black"
		ctx.font = "12px Arial"
		this.bars.forEach((bar, index) => {
			if (index % this.dateStep === 0) {
				const x = index * this.barWidth + this.offsetX + this.barWidth / 2

				if (x > 0 && x < this.canvas.width) {
					const date = new Date(bar.time * 1000) 
					const formattedDate = dateFormatter.format(date)

					ctx.fillText(formattedDate, x - 20, this.canvas.height - 5)
					ctx.beginPath()
					ctx.moveTo(x, 0)
					ctx.lineTo(x, this.canvas.height)
					ctx.strokeStyle = "#E0E0E0" 
					ctx.stroke()
				}
			}
		})
    }
	onScroll(event: WheelEvent) {
		const delta = event.deltaY > 0 ? -20 : 20
		this.offsetX = Math.min(0, this.offsetX + delta)
		const maxOffset = -(this.bars.length * 10 - this.canvas.width)
		this.offsetX = Math.max(this.offsetX, maxOffset)

		this.draw() 
	}

	onZoom(event: WheelEvent) {
		
		if (event.ctrlKey) { 
			event.preventDefault()
			const delta = event.deltaY > 0 ? -1 : 1
			this.barWidth = Math.max(this.minBarWidth, Math.min(this.maxBarWidth, this.barWidth + delta))
			const maxOffset = -(this.bars.length * this.barWidth - this.canvas.width)
			this.offsetX = Math.max(this.offsetX, maxOffset)
			this.draw()
		}
	}
}

class DataLoader {
	async fetchData(url: string): Promise<Bar[]> {
		const response = await fetch(url)
		const data = await response.json()
		console.log(data)
		return data[0].Bars.map((barData: any) => {
			return new Bar(
				barData.Open,
				barData.High,
				barData.Low,
				barData.Close,
				barData.Time
			)
		})
	}
}

const canvas = document.getElementById("chartCanvas") as HTMLCanvasElement
const chart = new Chart(canvas)
const dataLoader = new DataLoader()
async function init() {
	const bars = await dataLoader.fetchData(
		"https://beta.forextester.com/data/api/Metadata/bars/chunked?Broker=Advanced&Symbol=USDJPY&Timeframe=1&Start=57674&End=59113&UseMessagePack=false"
	)
	chart.setBars(bars)
	chart.draw()
}
init()
