'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Trash } from "lucide-react";

// 임시 데이터
const MOCK_FAVORITES = [
  { id: 1, title: 'Next.js 13 App Router 사용법', author: '김개발', date: '2023-06-15', board: 'dev' },
  { id: 2, title: '시스템 점검 안내', author: '운영팀', date: '2023-06-14', board: 'op' },
  { id: 3, title: '시스템 개요', author: '기술팀', date: '2023-06-13', board: 'manual' },
];

export default function FavoritePage() {
  const [favorites, setFavorites] = useState(MOCK_FAVORITES);

  // 즐겨찾기 삭제
  const handleRemoveFavorite = (id: number) => {
    setFavorites(favorites.filter(fav => fav.id !== id));
  };

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Star className="h-6 w-6 text-yellow-500" />
            <CardTitle>즐겨찾기</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {favorites.length > 0 ? (
            <div className="space-y-4">
              {favorites.map((favorite) => (
                <div 
                  key={favorite.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-color-primary-hovered/50"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{favorite.title}</span>
                      <span className="text-xs  px-2 py-1 rounded-full">
                        {favorite.board === 'dev' ? '개발' : favorite.board === 'op' ? '운영' : '매뉴얼'}
                      </span>
                    </div>
                    <div className="text-sm text-color-primary-muted-foreground mt-1">
                      <span>{favorite.author}</span>
                      <span className="mx-2">•</span>
                      <span>{favorite.date}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleRemoveFavorite(favorite.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-color-primary-muted-foreground">즐겨찾기한 게시글이 없습니다.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 