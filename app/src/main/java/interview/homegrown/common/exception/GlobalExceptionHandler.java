package interview.homegrown.common.exception;
import interview.homegrown.common.result.Result;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(CoreNotPublishedException.class)
    public ResponseEntity<Result<Void>> unavailable(CoreNotPublishedException error) {
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED)
                .body(Result.<Void>error(501, error.getMessage()));
    }
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<Result<Void>> business(BusinessException error) {
        return ResponseEntity.badRequest()
                .body(Result.<Void>error(error.getErrorCode()));
    }
}
