import {
    Controller, Get, Res, Query, Param,
} from '@nestjs/common';
import { BookService } from './book.service';
import { ShouldIntPipe } from '../core/pipes/should-int.pipe';
import { ParsePagePipe } from '../core/pipes/parse-page.pipe';
import { MustIntPipe } from '../core/pipes/must-int.pipe';
import { BookStatus } from '../entity/book.entity';
import { MyHttpException } from '../core/exception/my-http.exception';
import { ErrorCode } from '../constants/error';

@Controller()
export class BookController {
    constructor(
        private readonly bookService: BookService,
    ) {}

    @Get('/books')
    async booksView(@Query('c', ShouldIntPipe) c: number, @Query('page', ParsePagePipe) page: number, @Res() res) {
        const recommendHandBooks = [
            {
                name: 'Kubernetes 从上手到实践Kubernetes 从上手到实践Kubernetes 从上手到实践',
                saleCount: 1123,
                coverURL: '/images/index/book1.jpg',
            },
            {
                name: 'Kubernetes 从上手到实践',
                saleCount: 1123,
                coverURL: '/images/index/book1.jpg',
            },
        ];

        const categoryID = parseInt((c as any), 10) || 0;
        const pageSize = 20;

        const [categories, listResult] = await Promise.all([
            this.bookService.allCategories(),
            this.bookService.listInCategory(categoryID, page, pageSize),
        ]);

        res.render('pages/books/books', {
            recommendHandBooks,
            categoryID,
            categories,
            ...listResult,
        });
    }

    @Get('/books/:id')
    async bookView(@Param('id', MustIntPipe) id: number, @Res() res) {
        const [book, chapters] = await Promise.all([
            this.bookService.detail(id),
            this.bookService.chapters(id),
        ]);

        if (!book) {
            throw new MyHttpException({
                errorCode: ErrorCode.NotFound.CODE,
            });
        }
        res.render('pages/books/bookDetail', {
            book,
            chapters,
        });
    }

    @Get('/books/:bookID/chapters/:chapterID')
    async chapterView(@Param('bookID', MustIntPipe) bookID: number, @Param('chapterID', MustIntPipe) chapterID: number, @Res() res) {
        const [chapters, chapter] = await Promise.all([
            this.bookService.chapters(bookID),
            this.bookService.chapterDetail(chapterID),
        ]);
        if (!chapter || chapter.book.status !== BookStatus.BookVerifySuccess) {
            throw new MyHttpException({
                errorCode: ErrorCode.NotFound.CODE,
            });
        }
        res.render('pages/books/chapter', {
            chapter,
            chapters,
        });
    }

    @Get('/api/v1/books')
    async list(@Query('c', ShouldIntPipe) c: number, @Query('page', ParsePagePipe) page: number) {
        const categoryID = parseInt((c as any), 10) || 0;
        const pageSize = 20;
        const listResult = await this.bookService.listInCategory(categoryID, page, pageSize);
        return listResult;
    }
}