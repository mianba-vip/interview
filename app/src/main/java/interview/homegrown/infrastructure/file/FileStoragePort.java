package interview.homegrown.infrastructure.file;
import java.io.InputStream;
import java.util.Optional;
/** 对象存储边界，不包含生产存储位置或访问凭据。 */
public interface FileStoragePort {
    String store(byte[] content, String mediaType);
    Optional<InputStream> open(String key);
}
