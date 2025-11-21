import { Observable, type Subscriber } from "rxjs";

export function simulateStream(text: string, delayMs = 15): Observable<string> {
	return new Observable((subscriber: Subscriber<string>) => {
		// Stream 2-6 characters at a time to mimic human/LLM typing
		const chunks = text.match(/[\s\S]{1,4}/g) || [];
		let i = 0;

		const interval = setInterval(() => {
			if (i < chunks.length) {
				subscriber.next(chunks[i]);
				i++;
			} else {
				subscriber.complete();
				clearInterval(interval);
			}
		}, delayMs);

		return () => clearInterval(interval);
	});
}
