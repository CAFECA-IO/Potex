import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { OrderbookHeader } from "@/components/pages/futures/orderbook/OrderbookHeader";
import { OrderBookTableHeader } from "@/components/pages/futures/orderbook/OrderBookTableHeader";
import { OrderBookRow } from "@/components/pages/futures/orderbook/OrderBookRow";
import { BestPrices } from "@/components/pages/futures/orderbook/BestPrices";
import { DisplayTotals } from "@/components/pages/futures/orderbook/DisplayTotals";
import useWebSocketStore from "@/stores/trade/ws";
import useFuturesMarketStore from "@/stores/futures/market";
import { useTranslation } from "next-i18next";

const ordersLimit = 15;
const provider = process.env.NEXT_PUBLIC_EXCHANGE;
const tickSizeLimitMap = {
  0.01: provider === "kuc" ? 50 : 40,
  0.1: provider === "kuc" ? 50 : 80,
  1: provider === "kuc" ? 100 : 160,
  10: provider === "kuc" ? 100 : 320,
};

const orderBookWorker =
  typeof window !== "undefined" ? new Worker("/worker/orderBook.js") : null;

const OrderbookBase = () => {
  const { t } = useTranslation();
  const {
    subscribe,
    unsubscribe,
    addMessageHandler,
    removeMessageHandler,
    futuresTradesConnection,
  } = useWebSocketStore();
  const { market } = useFuturesMarketStore();
  const askRefs = useRef<Array<HTMLDivElement | null>>([]);
  const bidRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [hoveredType, setHoveredType] = useState<"ask" | "bid" | null>();
  const [visible, setVisible] = useState({ asks: true, bids: true });
  const [tickSize, setTickSize] = useState(0.01);
  const [isHovered, setIsHovered] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState({
    ask: null,
    bid: null,
  });
  const [orderBook, setOrderBook] = useState<{
    asks: {
      price: number;
      amount: number;
      total: number;
    }[];
    bids: {
      price: number;
      amount: number;
      total: number;
    }[];
    maxAskTotal: number;
    maxBidTotal: number;
    askPercentage: string;
    bidPercentage: string;
    bestPrices: {
      bestAsk: number;
      bestBid: number;
    };
  }>({
    asks: [],
    bids: [],
    maxAskTotal: 0,
    maxBidTotal: 0,
    askPercentage: "0.00",
    bidPercentage: "0.00",
    bestPrices: { bestAsk: 0, bestBid: 0 },
  });
  const [cardPosition, setCardPosition] = useState({ top: 0, left: 0 });

  const handleRowHover = (index: number, type: "ask" | "bid") => {
    setHoveredIndex((prev) => ({
      ...prev,
      [type]: index,
    }));
    setHoveredType(type);
    setIsHovered(true);
    const ref =
      type === "ask" ? askRefs.current[index] : bidRefs.current[index];
    if (ref) {
      const rect = ref.getBoundingClientRect();
      setCardPosition({
        top: rect.top,
        left: rect.left + rect.width,
      });
    }
  };

  const handleRowLeave = () => {
    setIsHovered(false);
    setHoveredIndex({ bid: null, ask: null });
    setHoveredType(null);
    setCardPosition({ ...cardPosition, top: 0 });
  };

  useEffect(() => {
    if (orderBookWorker && futuresTradesConnection?.isConnected) {
      orderBookWorker.onmessage = (event) => {
        setOrderBook(event.data);
      };
      orderBookWorker.onerror = (error) => {
        console.error("Error from worker:", error);
      };
    }
  }, [futuresTradesConnection?.isConnected]);

  const [orderbookReady, setOrderbookReady] = useState(false);
  useEffect(() => {
    if (futuresTradesConnection?.isConnected && market?.symbol) {
      const subscribePayload = {
        symbol: market.symbol,
      };
      subscribe("futuresTradesConnection", "orderbook", subscribePayload);
      setOrderbookReady(true);
      return () => {
        unsubscribe("futuresTradesConnection", "orderbook", subscribePayload);
        setOrderbookReady(false);
      };
    }
  }, [market?.symbol, futuresTradesConnection?.isConnected]);

  useEffect(() => {
    if (orderbookReady) {
      const handleOrderbookMessage = (message: any) => {
        if (message && message.data) {
          orderBookWorker?.postMessage(message.data);
        }
      };
      const messageFilter = (message: any) =>
        message.stream && message.stream.startsWith("orderbook");
      addMessageHandler(
        "futuresTradesConnection",
        handleOrderbookMessage,
        messageFilter
      );
      return () => {
        removeMessageHandler("futuresTradesConnection", handleOrderbookMessage);
        setOrderBook({
          asks: [],
          bids: [],
          maxAskTotal: 0,
          maxBidTotal: 0,
          askPercentage: "0.00",
          bidPercentage: "0.00",
          bestPrices: { bestAsk: 0, bestBid: 0 },
        });
      };
    }
  }, [orderbookReady]);

  return (
    <>
      <div className="relative w-full flex flex-col text-xs overflow-hidden z-5 min-w-[220px] ">
        <OrderbookHeader
          visible={visible}
          setVisible={setVisible}
          askPercentage={orderBook.askPercentage}
          bidPercentage={orderBook.bidPercentage}
        />
        <OrderBookTableHeader />
        <div className="flex flex-row md:flex-col">
          <div className="hidden md:block order-2 ">
            <BestPrices {...orderBook.bestPrices} />
          </div>
          {visible.asks && (
            <div className="min-h-[45vh] max-h-[45vh] overflow-hidden w-full order-1 flex flex-col-reverse grow">
              {orderBook.asks.length > 0 ? (
                orderBook.asks.map((ask, index) => (
                  <OrderBookRow
                    key={index}
                    index={index}
                    {...ask}
                    type="ask"
                    maxTotal={orderBook.maxAskTotal}
                    onRowHover={handleRowHover}
                    onRowLeave={handleRowLeave}
                    isSelected={
                      hoveredIndex.ask !== null && index <= hoveredIndex.ask
                    }
                    rowRef={(el) => (askRefs.current[index] = el)}
                    lastHoveredIndex={hoveredIndex.ask}
                  />
                ))
              ) : (
                <div className="flex items-center justify-center h-full">
                  <span className="text-muted-400 dark:text-muted-500">
                    {t("No Asks")}
                  </span>
                </div>
              )}
            </div>
          )}
          {visible.bids && (
            <div className="min-h-[45vh] max-h-[45vh] overflow-hidden w-full order-3 flex flex-col grow">
              {orderBook.bids.length > 0 ? (
                orderBook.bids.map((bid, index) => (
                  <OrderBookRow
                    key={index}
                    index={index}
                    {...bid}
                    type="bid"
                    maxTotal={orderBook.maxBidTotal}
                    onRowHover={handleRowHover}
                    onRowLeave={handleRowLeave}
                    isSelected={
                      hoveredIndex.bid !== null && index <= hoveredIndex.bid
                    }
                    rowRef={(el) => (bidRefs.current[index] = el)}
                    lastHoveredIndex={hoveredIndex.bid}
                  />
                ))
              ) : (
                <div className="flex items-center justify-center h-full">
                  <span className="text-muted-400 dark:text-muted-500">
                    {t("No Bids")}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
        {isHovered && (
          <DisplayTotals
            currency={market?.currency}
            pair={market?.pair}
            orderBook={orderBook}
            hoveredIndex={hoveredIndex}
            hoveredType={hoveredType}
            cardPosition={cardPosition}
            isHovered={isHovered}
          />
        )}
      </div>
    </>
  );
};
export const Orderbook = memo(OrderbookBase);
