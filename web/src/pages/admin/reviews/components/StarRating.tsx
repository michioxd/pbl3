import { Star } from "lucide-react";

type StarRatingProps = {
    rating: number;
    maxRating?: number;
    size?: "sm" | "md" | "lg";
};

export function StarRating({ rating, maxRating = 5, size = "md" }: StarRatingProps) {
    const sizeClasses = {
        sm: "h-3 w-3",
        md: "h-4 w-4",
        lg: "h-5 w-5",
    };

    return (
        <div className="flex items-center gap-0.5">
            {Array.from({ length: maxRating }, (_, i) => (
                <Star
                    key={i}
                    className={`${sizeClasses[size]} ${
                        i < rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "fill-gray-200 text-gray-200"
                    }`}
                />
            ))}
            <span className="ml-1 text-sm font-medium text-muted-foreground">
                {rating}/{maxRating}
            </span>
        </div>
    );
}
