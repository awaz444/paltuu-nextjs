import React from "react";
import Image from "next/image";
import Link from "next/link";
import { BlogPost } from "./data";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock, faUser } from "@fortawesome/free-solid-svg-icons";

interface BlogCardProps {
    post: BlogPost;
}

const BlogCard: React.FC<BlogCardProps> = ({ post }) => {
    return (
        <Link href={`/blogs/${post.slug}`} className="group h-full">
            <div className="h-full flex flex-col bg-white rounded-2xl shadow-sm border-2 border-transparent hover:border-primary/20 hover:shadow-lg transition-all duration-300 overflow-hidden relative group-hover:-translate-y-1">
                {/* Image Section */}
                <div className="relative h-48 w-full overflow-hidden">
                    <Image
                        src={post.image}
                        alt={post.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-4 left-4">
                        <span className="bg-white/90 backdrop-blur-sm text-primary text-xs font-bold px-3 py-1 rounded-full shadow-sm uppercase tracking-wide">
                            {post.category}
                        </span>
                    </div>
                </div>

                {/* Content Section */}
                <div className="flex flex-col flex-grow p-6">
                    {/* Meta Info */}
                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                        <span className="flex items-center gap-1">
                            <FontAwesomeIcon icon={faUser} className="w-3 h-3" />
                            {post.author}
                        </span>
                        <span>•</span>
                        <span>{post.date}</span>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                        {post.title}
                    </h3>

                    {/* Excerpt */}
                    <p className="text-gray-600 text-sm line-clamp-3 mb-4 flex-grow">
                        {post.excerpt}
                    </p>

                    {/* Footer */}
                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between mt-auto">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                            <FontAwesomeIcon icon={faClock} className="w-3 h-3" />
                            {post.readTime}
                        </span>
                        <span className="text-sm font-semibold text-primary group-hover:underline">
                            Read More →
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default BlogCard;
